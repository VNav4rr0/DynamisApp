import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { format, subMonths, subYears, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ptBR, enUS } from 'date-fns/locale';

import { db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { AppStackParamList, AuthStackParamList } from '../../App';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

type MaterialCommunityIconName = 'coffee-outline' | 'silverware-fork-knife' | 'food-apple';

const refeicoes: { nomeKey: string; icone: MaterialCommunityIconName }[] = [
    { nomeKey: 'nutricionista.breakfast', icone: 'coffee-outline' },
    { nomeKey: 'nutricionista.lunch', icone: 'silverware-fork-knife' },
    { nomeKey: 'nutricionista.afternoon_snack', icone: 'coffee-outline' },
    { nomeKey: 'nutricionista.dinner', icone: 'silverware-fork-knife' },
    { nomeKey: 'nutricionista.supper', icone: 'food-apple' },
];


// Definição de períodos internos (curtos e sem tradução)
type PeriodKey = '1m' | '3m' | '6m' | '1a' | 'mais';

const PERIODS: PeriodKey[] = ['1m', '3m', '6m', '1a', 'mais'];

// Mapeamento para as chaves de tradução do i18n
const periodKeyMap: Record<PeriodKey, string> = {
  '1m': 'progress.period_1month',
  '3m': 'progress.period_3months',
  '6m': 'progress.period_6months',
  '1a': 'progress.period_1year',
  'mais': 'progress.period_more',
};




const CHART_CONFIG = {
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
    decimalPlaces: 1,
    color: () => '#AEF359',
    labelColor: () => 'rgba(255, 255, 255, 0.5)',
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#AEF359' },
    propsForBackgroundLines: { stroke: 'rgba(255, 255, 255, 0.1)' },
    fillShadowGradient: '#AEF359',
    fillShadowGradientOpacity: 0.2,
    yAxisLabel: 'kg ',
    formatYLabel: (yLabel: string) => parseFloat(yLabel).toFixed(1),
};

interface ClientDailyLogEntry { calories: number; weight: number; water: number; timestamp: string; }
interface ClientMetas { pesoMeta?: number; pesoAtual?: number; }
interface ClientNutritionalGoals { metaCalorias?: number; macros?: { proteina: number; carboidratos: number; gordura: number; }; }
interface ClientMealPlan { [day: string]: { [meal: string]: string; }; }
interface ClientImportantNotes { notes: string; }
interface ClientData {
    uid: string;
    nome: string;
    email: string;
    codigoPartilha: string;
    dailyLogs?: Record<string, ClientDailyLogEntry>;
    metas?: ClientMetas;
    calculosNutricionais?: ClientNutritionalGoals;
    planosDeRefeicao?: ClientMealPlan;
    avisosImportantes?: ClientImportantNotes;
    nutricionistaVinculadoUID?: string;
}

type NutricionistaScreenProps = NativeStackScreenProps<AppStackParamList & AuthStackParamList, 'Nutricionista'> & {
    onLogout: () => void;
};

const NutricionistaScreen: React.FC<NutricionistaScreenProps> = ({ route, navigation, onLogout }) => {
    const { t, i18n } = useTranslation();
    const { clientUid } = route.params || {};

    const [selectedClientData, setSelectedClientData] = useState<ClientData | null>(null);
    const [isLoadingClientData, setIsLoadingClientData] = useState(true);
    const [errorClientData, setErrorClientData] = useState<string | null>(null);
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('1m');
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [mealDescriptions, setMealDescriptions] = useState<Record<string, string>>({});
    const [importantNotes, setImportantNotes] = useState('');
    const [isLoadingSave, setIsLoadingSave] = useState(false);

    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
  formatter.format(new Date(2023, 0, i + 1))
);


    
const toggleLanguage = () => {
  const newLang = i18n.language === 'pt' ? 'en' : 'pt';
  i18n.changeLanguage(newLang);
};



    // --- Fetch client data ---
    const fetchClientFullData = useCallback(async (uid: string) => {
        setIsLoadingClientData(true);
        setErrorClientData(null);
        setSelectedClientData(null);
        try {
            const userDocRef = doc(db, "usuarios", uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const data = { ...userDocSnap.data(), uid: userDocSnap.id } as ClientData;
                setSelectedClientData(data);

                const currentDayPlan = data.planosDeRefeicao?.[daysOfWeek[selectedDayIndex]] || {};
                const newMealDescriptions: Record<string, string> = {};
                refeicoes.forEach(refeicao => {
                newMealDescriptions[refeicao.nomeKey] = currentDayPlan[refeicao.nomeKey] || '';
            });
                setMealDescriptions(newMealDescriptions);
                setImportantNotes(data.avisosImportantes?.notes || '');
            } else {
                setErrorClientData(t('nutricionista.client_data_not_found'));
            }
        } catch (error) {
            setErrorClientData(t('nutricionista.client_data_error'));
        } finally {
            setIsLoadingClientData(false);
        }
    }, [selectedDayIndex, t]);

    // --- Save client data ---
        const saveClientData = useCallback(async () => {
            if (!selectedClientData?.uid) {
                Alert.alert(t('common.error'), t('nutricionista.no_client_selected'));
                return;
            }
            setIsLoadingSave(true);
            try {
                const clientDocRef = doc(db, "usuarios", selectedClientData.uid);
                const currentDayName = daysOfWeek[selectedDayIndex];
                const updatedMealPlan = { ...(selectedClientData.planosDeRefeicao || {}), [currentDayName]: mealDescriptions };
                const updatedImportantNotes = { notes: importantNotes };
                await updateDoc(clientDocRef, { planosDeRefeicao: updatedMealPlan, avisosImportantes: updatedImportantNotes });
                setSelectedClientData(prev => prev ? { ...prev, planosDeRefeicao: updatedMealPlan, avisosImportantes: updatedImportantNotes } : null);
                Alert.alert(t('common.success'), t('nutricionista.plan_saved', { nome: selectedClientData.nome }));
            } catch (error) {
                Alert.alert(t('common.error'), t('nutricionista.save_failed'));
            } finally {
                setIsLoadingSave(false);
            }
        }, [selectedClientData, selectedDayIndex, mealDescriptions, importantNotes, t]);

        useEffect(() => {
            if (clientUid) {
                fetchClientFullData(clientUid);
            } else {
                setIsLoadingClientData(false);
                setErrorClientData(t('nutricionista.no_client_selected'));
            }
        }, [clientUid, selectedDayIndex, fetchClientFullData]);

    // --- Chart data ---
    const chartData = useMemo(() => {
    if (!selectedClientData?.dailyLogs || Object.keys(selectedClientData.dailyLogs).length === 0) {
        return { labels: [], datasets: [{ data: [] }], isEmpty: true, chartWidth: width - 40 };
    }
        const sortedDates = Object.keys(selectedClientData.dailyLogs).sort();
    let dataPoints: number[] = [];
    let labels: string[] = [];
    let startDate: Date;
    const today = startOfDay(new Date());
    const currentLocale = i18n.language === 'pt' ? ptBR : enUS;
        
        switch (activePeriod) {
        case '1m': startDate = subMonths(today, 1); break;
        case '3m': startDate = subMonths(today, 3); break;
        case '6m': startDate = subMonths(today, 6); break;
        case '1a': startDate = subYears(today, 1); break;
        case 'mais': startDate = new Date(0); break;
    }
        sortedDates.forEach(dateStr => {
        const logDate = parseISO(dateStr);
        if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
            const weight = selectedClientData.dailyLogs?.[dateStr]?.weight;
            if (typeof weight === 'number') {
                dataPoints.push(weight);
                labels.push(format(logDate, 'MMM dd', { locale: currentLocale })); // <-- aplica locale
            }
        }
    });
    if (dataPoints.length === 0) return { labels: [], datasets: [{ data: [] }], isEmpty: true, chartWidth: width - 40 };
    const chartRenderWidth = Math.max(width - 40, labels.length * 50);
    return { labels, datasets: [{ data: dataPoints }], isEmpty: false, chartWidth: chartRenderWidth };
}, [selectedClientData, activePeriod, width, i18n.language]);


    const hasDataForPeriod = useCallback((period: PeriodKey) => {
        if (!selectedClientData?.dailyLogs || Object.keys(selectedClientData.dailyLogs).length === 0) return false;
        let startDate: Date;
        const today = startOfDay(new Date());
        switch (period) {
            case '1m': startDate = subMonths(today, 1); break;
            case '3m': startDate = subMonths(today, 3); break;
            case '6m': startDate = subMonths(today, 6); break;
            case '1a': startDate = subYears(today, 1); break;
            case 'mais': startDate = new Date(0); break;
        }
        for (const dateString of Object.keys(selectedClientData.dailyLogs)) {
            const logDate = parseISO(dateString);
            if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
                const weightValue = selectedClientData.dailyLogs[dateString].weight;
                if (typeof weightValue === 'number') return true;
            }
        }
        return false;
    }, [selectedClientData]);

    useEffect(() => {
        if (selectedClientData && !hasDataForPeriod(activePeriod)) {
            if (hasDataForPeriod('mais')) {
                setActivePeriod('mais');
            } else {
                setActivePeriod('1m');
            }
        }
    }, [activePeriod, hasDataForPeriod, selectedClientData]);

    const updateMealDescription = (mealName: string, text: string) => {
        setMealDescriptions(prev => ({ ...prev, [mealName]: text }));
    };

    const updateImportantNotes = (text: string) => {
        setImportantNotes(text);
    };

    const handleLogout = useCallback(() => {
        setSelectedClientData(null);
        Alert.alert(t('common.client'), t('nutricionista.logout_client_session'), [{ 
            text: "OK", 
            onPress: onLogout 
        }]);
    }, [onLogout, t]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/background_nutri.png')}
                    style={styles.headerImage}
                    resizeMode="cover"
                />
                <View style={styles.headerOverlay}></View>
            </View>

{/* Seletor de idioma */}
<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
  <TouchableOpacity
    onPress={toggleLanguage}
    style={{
      backgroundColor: '#AEF359',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    }}
  >
    <Text style={{ color: '#000', fontWeight: 'bold' }}>
      {i18n.language === 'pt' ? 'EN' : 'PT'}
    </Text>
  </TouchableOpacity>
</View>


            {/* Loading / Error / Content */}
            {isLoadingClientData ? (
                <View style={styles.loadingClientContainer}>
                    <ActivityIndicator size="large" color="#AEF359" />
                    <Text style={styles.loadingClientText}>{t('nutricionista.loading_client_data')}</Text>
                </View>
            ) : errorClientData || !selectedClientData ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={40} color="#C62828" />
                    <Text style={styles.errorText}>{errorClientData || t('nutricionista.client_data_not_found')}</Text>
                    <TouchableOpacity onPress={() => clientUid && fetchClientFullData(clientUid)} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>{t('nutricionista.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.title}>{t('nutricionista.hello_nutritionist')}</Text>
                    <Text style={styles.subtitle}>
                        {t('nutricionista.active_session_for')} <Text style={{ fontWeight: 'bold' }}>{selectedClientData.nome}</Text>. {t('nutricionista.changes_visible_only_to_client')}
                    </Text>

                    {/* Period selector */}
                    <View style={styles.periodSelector}>
                        {PERIODS.map((p) => (
                            <TouchableOpacity
                            key={p}
                            onPress={() => setActivePeriod(p)}
                            style={[
                                styles.periodButton,
                                activePeriod === p && styles.periodButtonActive,
                                chartData.isEmpty && styles.periodButtonDisabled,
                            ]}
                            disabled={chartData.isEmpty}
                            >
                            <Text
                                style={[
                                styles.periodButtonText,
                                activePeriod === p && styles.periodButtonTextActive,
                                chartData.isEmpty && styles.periodButtonTextDisabled,
                                ]}
                            >
                                {t(periodKeyMap[p])} {/* ← Aqui traduz certinho */}
                            </Text>
                            </TouchableOpacity>
                        ))}
                        </View>


                    {/* Chart */}
                    <View style={styles.chartWrapper}>
                        {chartData.isEmpty ? (
                            <View style={styles.noChartDataContainer}>
                                <MaterialIcons name="bar-chart" size={40} color="#9E9E9E" />
                                <Text style={styles.noChartDataText}>{t('nutricionista.no_weight_data')}</Text>
                                <Text style={styles.noChartDataText}>{t('nutricionista.ask_client_to_record')}</Text>
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <LineChart
                                    data={{
                                        labels: chartData.labels,
                                        datasets: chartData.datasets,
                                    }}
                                    width={chartData.chartWidth}
                                    height={220}
                                    chartConfig={CHART_CONFIG}
                                    bezier
                                    withVerticalLabels
                                    withHorizontalLabels
                                    segments={5}
                                    style={styles.chart}
                                />
                            </ScrollView>
                        )}
                    </View>

                    {/* Refeições e notas */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('nutricionista.meal_division')}</Text>
                        <Text style={styles.sectionSubtitle}>{t('nutricionista.add_food_quantities_times')}</Text>
                    </View>

                    {/* Days */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekDaysContainer}>
                        {daysOfWeek.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedDayIndex(index)}
                                style={[styles.dayButton, selectedDayIndex === index && styles.dayButtonActive]}
                            >
                                <Text style={[styles.dayButtonText, selectedDayIndex === index && styles.dayButtonTextActive]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Refeições cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {refeicoes.map((ref, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name={ref.icone} size={20} color="#82CD32" />
                            </View>
                            <Text style={styles.cardTitle}>{t(ref.nomeKey)}</Text>
                        </View>
                        <TextInput
                            placeholder={t('nutricionista.add_food_description')}
                            placeholderTextColor="#bbb"
                            style={styles.inputBox}
                            multiline
                            value={mealDescriptions[ref.nomeKey]}
                            onChangeText={(text) => updateMealDescription(ref.nomeKey, text)}
                        />
                        <TouchableOpacity style={styles.cardButton} onPress={saveClientData}> 
                            <MaterialCommunityIcons name="playlist-plus" size={18} color="#000" />
                            <Text style={styles.buttonText}>{t('nutricionista.save_meal')}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                    </ScrollView>

                    {/* Avisos importantes */}
                    <View style={styles.importantBox}>
                        <View style={styles.importantHeader}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#AEF359" style={{ marginRight: 6 }} />
                            <Text style={styles.importantTitle}>{t('nutricionista.important_notes')}</Text>
                        </View>
                        <TextInput
                            placeholder={t('nutricionista.important_notes_placeholder')}
                            placeholderTextColor="#bbb"
                            style={styles.inputBox}
                            multiline
                            value={importantNotes}
                            onChangeText={updateImportantNotes}
                        />
                        <TouchableOpacity style={styles.cardButton} onPress={saveClientData}> 
                            <MaterialCommunityIcons name="bell-plus" size={18} color="#000" />
                            <Text style={styles.buttonText}>{t('nutricionista.save_note')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Botão salvar geral */}
                    <TouchableOpacity onPress={saveClientData} style={styles.saveButton} disabled={isLoadingSave}>
                        {isLoadingSave ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <>
                                <MaterialIcons name="save" size={20} color="#000" />
                                <Text style={styles.saveButtonText}>{t('nutricionista.save_changes')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.footerText}>{t('nutricionista.access_permanent')}</Text>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <MaterialCommunityIcons name="logout" size={18} color="#AEF359" />
                <Text style={styles.logoutText}>{t('nutricionista.logout_button')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: 20,
    },
    headerContainer: {
        position: 'relative',
        height: 250,
        width: '110%',
        left: -20,
        justifyContent: 'flex-end',
        paddingBottom: 34,
        overflow: 'hidden',
    },
    headerImage: {
        position: 'absolute',
        width: '100%',
        height: '150%',
        top: 0,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 30,
    },
    subtitle: {
        color: '#bbb',
        fontSize: 14,
        marginTop: 5,
        marginBottom: 20,
    },
    accessCodeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -100,
        marginBottom: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 50,
        padding: 4,
    },
    accessCodeInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    accessCodeButton: {
        backgroundColor: '#AEF359',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accessCodeButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorClientText: {
        color: '#C62828',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    noClientSelectedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        marginTop: 20,
        minHeight: 250,
    },
    noClientSelectedText: {
        color: '#9E9E9E',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 15,
    },
    retryButton: {
        backgroundColor: '#AEF359',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 15,
    },
    retryButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 50,
        padding: 4,
        marginTop: 20,
        justifyContent: 'space-between',
    },
    periodButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 50,
        flex: 1,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#AEF359',
    },
    periodButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    periodButtonTextActive: {
        color: '#000',
    },
    periodButtonDisabled: {
        opacity: 0.5,
    },
    periodButtonTextDisabled: {
        color: '#888',
    },
    chartWrapper: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1C1C1E',
        paddingVertical: 10,
    },
    chart: {
        borderRadius: 20,
    },
    noChartDataContainer: {
        alignItems: 'center',
        padding: 20,
        minHeight: 180,
        justifyContent: 'center',
    },
    noChartDataText: {
        color: '#9E9E9E',
        marginTop: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    loadingClientContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        marginTop: 20,
        minHeight: 250,
    },
    loadingClientText: {
        color: '#FFF',
        fontSize: 16,
        marginTop: 10,
    },
    section: {
        marginTop: 40,
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 7,
    },
    sectionSubtitle: {
        color: '#bbb',
        fontSize: 14,
    },
    weekDaysContainer: {
        flexDirection: 'row',
        marginTop: 24,
        marginBottom: 16,
        justifyContent: 'space-between',
        width: '100%',
    },
    dayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    dayButtonActive: {
        backgroundColor: '#AEF359',
    },
    dayButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    dayButtonTextActive: {
        color: '#000',
    },
    horizontalScroll: {
        paddingVertical: 12,
        minHeight: 200,
    },
    card: {
        width: width * 0.7,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 16,
        marginRight: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconCircle: {
        backgroundColor: '#264D1F',
        borderRadius: 20,
        padding: 6,
        marginRight: 8,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputBox: {
        backgroundColor: '#2c2c2e',
        color: '#FFF',
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    cardButton: {
        backgroundColor: '#AEF359',
        padding: 12,
        borderRadius: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#000',
    },
    importantBox: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 16,
        marginTop: 30,
        borderWidth: 1,
        borderColor: '#AEF359',
        minHeight: 250,
    },
    importantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        minHeight: 60,
    },
    importantTitle: {
        color: '#AEF359',
        fontSize: 20,
        fontWeight: 'bold',
    },
    footerText: {
        color: '#bbb',
        fontSize: 17,
        marginTop: 24,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    logoutButton: {
        marginTop: 52,
        marginBottom: 50,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#AEF359',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#AEF359',
        paddingVertical: 15,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 30,
        marginHorizontal: 20,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        marginTop: 20,
        minHeight: 250,
    },
    errorText: {
        color: '#C62828',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 16,
    },
});

export default NutricionistaScreen;