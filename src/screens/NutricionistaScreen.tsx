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
import { useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, subMonths, subYears, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Firebase Imports ---
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// --- Tipagens do App.tsx ---
import { AppStackParamList, AuthStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type MaterialCommunityIconName =
    | 'coffee-outline'
    | 'silverware-fork-knife'
    | 'food-apple';

const refeicoes: { nome: string; icone: MaterialCommunityIconName }[] = [
    { nome: 'Café da Manhã', icone: 'coffee-outline' },
    { nome: 'Almoço', icone: 'silverware-fork-knife' },
    { nome: 'Café da Tarde', icone: 'coffee-outline' },
    { nome: 'Jantar', icone: 'silverware-fork-knife' },
    { nome: 'Ceia', icone: 'food-apple' },
];

const PERIODS: PeriodKey[] = ['1m', '3m', '6m', '1a', 'mais'];
const PERIOD_LABELS = {
    '1m': '1 mês',
    '3m': '3 meses',
    '6m': '6 meses',
    '1a': '1 ano',
    'mais': 'Mais',
};

type PeriodKey = '1m' | '3m' | '6m' | '1a' | 'mais';

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
    const { clientUid, clientName } = route.params || {};

    const [selectedClientData, setSelectedClientData] = useState<ClientData | null>(null);
    const [isLoadingClientData, setIsLoadingClientData] = useState(true);
    const [errorClientData, setErrorClientData] = useState<string | null>(null);
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('1m');
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [mealDescriptions, setMealDescriptions] = useState<Record<string, string>>({});
    const [importantNotes, setImportantNotes] = useState('');
    const [isLoadingSave, setIsLoadingSave] = useState(false);

    const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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
                    newMealDescriptions[refeicao.nome] = currentDayPlan[refeicao.nome] || '';
                });
                setMealDescriptions(newMealDescriptions);
                setImportantNotes(data.avisosImportantes?.notes || '');
            } else {
                setErrorClientData("Dados do cliente não encontrados.");
            }
        } catch (error) {
            setErrorClientData("Erro ao carregar dados do cliente.");
        } finally {
            setIsLoadingClientData(false);
        }
    }, [selectedDayIndex]);

    const saveClientData = useCallback(async () => {
        if (!selectedClientData || !selectedClientData.uid) {
            Alert.alert("Erro", "Nenhum cliente selecionado para salvar.");
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
            Alert.alert("Sucesso", `Plano e avisos para ${selectedClientData.nome || 'o cliente'} salvos com sucesso!`);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar as alterações.");
        } finally {
            setIsLoadingSave(false);
        }
    }, [selectedClientData, selectedDayIndex, mealDescriptions, importantNotes]);


    useEffect(() => {
        if (clientUid) {
            fetchClientFullData(clientUid);
        } else {
            setIsLoadingClientData(false);
            setErrorClientData("Nenhum cliente selecionado. Use o código de acesso para carregar um cliente.");
        }
    }, [clientUid, selectedDayIndex, fetchClientFullData]);

    const chartData = useMemo(() => {
        if (!selectedClientData?.dailyLogs || Object.keys(selectedClientData.dailyLogs).length === 0) {
            return { labels: [], datasets: [{ data: [] }], isEmpty: true, chartWidth: width - 40 };
        }
        const sortedDates = Object.keys(selectedClientData.dailyLogs).sort();
        let dataPoints: number[] = [];
        let labels: string[] = [];
        let startDate: Date;
        const today = startOfDay(new Date()); 
        
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
                    labels.push(format(logDate, 'dd/MM'));
                }
            }
        });
        if (dataPoints.length === 0) return { labels: [], datasets: [{ data: [] }], isEmpty: true, chartWidth: width - 40 };
        const chartRenderWidth = Math.max(width - 40, labels.length * 50);
        return { labels, datasets: [{ data: dataPoints }], isEmpty: false, chartWidth: chartRenderWidth };
    }, [selectedClientData, activePeriod, width]);

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
        Alert.alert("Sessão Encerrada", "Você foi desconectado do plano do cliente.", [{ 
            text: "OK", 
            onPress: onLogout 
        }]);
    }, [onLogout]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Header com a imagem de fundo */}
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/background_nutri.png')}
                    style={styles.headerImage}
                    resizeMode="cover"
                />
                <View style={styles.headerOverlay}></View>
            </View>

            {/* SEÇÃO PRINCIPAL (SÓ VISÍVEL SE HÁ CLIENTE SELECIONADO OU CARREGANDO) */}
            {isLoadingClientData ? (
                <View style={styles.loadingClientContainer}>
                    <ActivityIndicator size="large" color="#AEF359" />
                    <Text style={styles.loadingClientText}>Carregando dados do cliente...</Text>
                </View>
            ) : errorClientData || !selectedClientData ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={40} color="#C62828" />
                    <Text style={styles.errorText}>{errorClientData || "Cliente não encontrado."}</Text>
                    <TouchableOpacity onPress={() => clientUid && fetchClientFullData(clientUid)} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.title}>Olá, Nutricionista</Text>
                    <Text style={styles.subtitle}>
                        Sessão de edição ativa para: <Text style={{ fontWeight: 'bold' }}>{selectedClientData.nome}</Text>. As suas alterações são visíveis apenas para este utilizador.
                    </Text>

                    <View style={styles.periodSelector}>
                        {PERIODS.map((p) => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setActivePeriod(p)}
                                style={[
                                    styles.periodButton,
                                    activePeriod === p && styles.periodButtonActive,
                                    chartData.isEmpty && styles.periodButtonDisabled
                                ]}
                                disabled={chartData.isEmpty}
                            >
                                <Text style={[
                                    styles.periodButtonText,
                                    activePeriod === p && styles.periodButtonTextActive,
                                    chartData.isEmpty && styles.periodButtonTextDisabled
                                ]}>
                                    {PERIOD_LABELS[p]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.chartWrapper}>
                        {chartData.isEmpty ? (
                            <View style={styles.noChartDataContainer}>
                                <MaterialIcons name="bar-chart" size={40} color="#9E9E9E" />
                                <Text style={styles.noChartDataText}>Nenhum dado de peso encontrado para este cliente.</Text>
                                <Text style={styles.noChartDataText}>Peça ao cliente para registrar o peso na Home.</Text>
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

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Divisão das Refeições</Text>
                        <Text style={styles.sectionSubtitle}>
                            Adicione os alimentos, quantidades e horários para cada refeição
                        </Text>
                    </View>

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

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {refeicoes.map((ref, index) => (
                            <View key={index} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <MaterialCommunityIcons name={ref.icone} size={20} color="#82CD32" />
                                    </View>
                                    <Text style={styles.cardTitle}>{ref.nome}</Text>
                                </View>
                                <TextInput
                                    placeholder="Adicionar descrição alimentar..."
                                    placeholderTextColor="#bbb"
                                    style={styles.inputBox}
                                    multiline
                                    value={mealDescriptions[ref.nome]}
                                    onChangeText={(text) => updateMealDescription(ref.nome, text)}
                                />
                                <TouchableOpacity style={styles.cardButton} onPress={saveClientData}> 
                                    <MaterialCommunityIcons name="playlist-plus" size={18} color="#000" />
                                    <Text style={styles.buttonText}>Salvar Refeição</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.importantBox}>
                        <View style={styles.importantHeader}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#AEF359" style={{ marginRight: 6 }} />
                            <Text style={styles.importantTitle}>Avisos Importantes</Text>
                        </View>
                        <TextInput
                            placeholder="Se caso houver uma informação importante..."
                            placeholderTextColor="#bbb"
                            style={styles.inputBox}
                            multiline
                            value={importantNotes}
                            onChangeText={updateImportantNotes}
                        />
                        <TouchableOpacity style={styles.cardButton} onPress={saveClientData}> 
                            <MaterialCommunityIcons name="bell-plus" size={18} color="#000" />
                            <Text style={styles.buttonText}>Salvar Aviso</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={saveClientData} style={styles.saveButton} disabled={isLoadingSave}>
                        {isLoadingSave ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <>
                                <MaterialIcons name="save" size={20} color="#000" />
                                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.footerText}>
                Este acesso é permanente. Ao sair, precisará do mesmo código para continuar a editar o plano deste paciente.
            </Text>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <MaterialCommunityIcons name="logout" size={18} color="#AEF359" />
                <Text style={styles.logoutText}>Sair da Sessão do Cliente</Text>
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