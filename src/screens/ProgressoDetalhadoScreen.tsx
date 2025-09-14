import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit'; // Importação correta
import { useTranslation } from 'react-i18next';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subMonths, subYears, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
// --- Firebase Imports ---
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// --- Tipagem ---
export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

type ProgressoDetalhadoProps = BottomTabScreenProps<MainTabParamList, 'ProgressoDetalhadoTab'>;

interface MacroData {
    proteina: number;
    carboidratos: number;
    gordura: number;
}

interface UserNutritionalGoals {
    tmb: number;
    get: number;
    metaCalorias: number;
    macros: MacroData;
    dataCalculo: string;
}

interface DailyLogEntry {
    calories: number;
    weight: number;
    water: number;
    timestamp: string;
}

const CHART_CONFIG = {
    backgroundGradientFrom: '#181917',
    backgroundGradientTo: '#181917',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(174, 243, 89, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, 0.5)`,
    propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: "#AEF359"
    },
    propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: 'rgba(255, 255, 255, 0.1)'
    },
    fillShadowGradient: '#AEF359',
    fillShadowGradientOpacity: 0.2,
};

const PERIODS: Array<'1m' | '3m' | '6m' | '1a' | 'mais'> = ['1m', '3m', '6m', '1a', 'mais'];
const periodKeyMap = {
    '1m': 'period_1month',
    '3m': 'period_3months',
    '6m': 'period_6months',
    '1a': 'period_1year',
    'mais': 'period_more',
};

// --- Componente ---
const ProgressoDetalhadoScreen: React.FC<ProgressoDetalhadoProps> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const [activePeriod, setActivePeriod] = useState<'1m' | '3m' | '6m' | '1a' | 'mais'>('1m');

    const [nutritionalGoals, setNutritionalGoals] = useState<UserNutritionalGoals | null>(null);
    const [isLoadingMacros, setIsLoadingMacros] = useState(true);
    const [errorLoadingMacros, setErrorLoadingMacros] = useState<string | null>(null);

    const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLogEntry> | null>(null);
    const [pesoMeta, setPesoMeta] = useState<number | null>(null);
    const [isLoadingWeightData, setIsLoadingWeightData] = useState(true);
    const [errorLoadingWeightData, setErrorLoadingWeightData] = useState<string | null>(null);
    
    const [hasAnyWeightData, setHasAnyWeightData] = useState(false); 


    const fetchNutritionalGoals = useCallback(async () => {
        setIsLoadingMacros(true);
        setErrorLoadingMacros(null);
        const user = auth.currentUser;

        if (!user) {
            setErrorLoadingMacros("Você precisa estar logado para ver seus dados nutricionais.");
            setIsLoadingMacros(false);
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.calculosNutricionais) {
                    setNutritionalGoals(userData.calculosNutricionais as UserNutritionalGoals);
                } else {
                    setErrorLoadingMacros("Dados nutricionais não calculados. Por favor, complete seu cadastro.");
                }
            } else {
                setErrorLoadingMacros("Seu perfil não foi encontrado. Faça login novamente.");
            }
        } catch (error) {
            console.error("ProgressoDetalhado (macros): Erro ao buscar dados nutricionais:", error);
            setErrorLoadingMacros("Erro ao carregar dados nutricionais. Verifique sua conexão.");
        } finally {
            setIsLoadingMacros(false);
        }
    }, []);

    const fetchWeightData = useCallback(async () => {
        setIsLoadingWeightData(true);
        setErrorLoadingWeightData(null);
        const user = auth.currentUser;

        if (!user) {
            setErrorLoadingWeightData("Você precisa estar logado para ver sua evolução de peso.");
            setIsLoadingWeightData(false);
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                if (userData.dailyLogs && Object.keys(userData.dailyLogs).length > 0) {
                    setDailyLogs(userData.dailyLogs as Record<string, DailyLogEntry>);
                    setHasAnyWeightData(true); 
                } else {
                    setDailyLogs({}); 
                    setHasAnyWeightData(false);
                }

                if (userData.metas && userData.metas.pesoMeta) {
                    setPesoMeta(Number(userData.metas.pesoMeta));
                } else {
                    setPesoMeta(null);
                }
            } else {
                setErrorLoadingWeightData("Seu perfil não foi encontrado. Faça login novamente.");
                setHasAnyWeightData(false);
            }
        } catch (error) {
            console.error("ProgressoDetalhado (peso): Erro ao buscar dados de peso:", error);
            setErrorLoadingWeightData("Erro ao carregar dados de peso. Verifique sua conexão.");
            setHasAnyWeightData(false);
        } finally {
            setIsLoadingWeightData(false);
        }
    }, []);

    useEffect(() => {
        fetchNutritionalGoals();
        fetchWeightData();
    }, [fetchNutritionalGoals, fetchWeightData]);

    const chartWeightData = useMemo(() => {
        if (!dailyLogs || Object.keys(dailyLogs).length === 0) {
            return {
                labels: [],
                datasets: [{ data: [] }],
                isEmpty: true
            };
        }

        const sortedDates = Object.keys(dailyLogs).sort();
        const filteredData: { date: Date; weight: number }[] = [];
        let startDate: Date;
        const today = startOfDay(new Date());

        switch (activePeriod) {
            case '1m': startDate = startOfDay(subMonths(today, 1)); break;
            case '3m': startDate = startOfDay(subMonths(today, 3)); break;
            case '6m': startDate = startOfDay(subMonths(today, 6)); break;
            case '1a': startDate = startOfDay(subYears(today, 1)); break;
            default: startDate = new Date(0); break;
        }

        for (const dateString of sortedDates) {
            const logDate = parseISO(dateString);
            if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
                const weightValue = dailyLogs[dateString].weight;
                if (typeof weightValue === 'number' && !isNaN(weightValue)) {
                    filteredData.push({ date: logDate, weight: weightValue });
                }
            }
        }
        
        if (filteredData.length === 0) {
             return { labels: [], datasets: [{ data: [] }], isEmpty: true };
        }

        // Simplifica as labels para evitar sobreposição
        const labels = filteredData.map((data, index) => {
            if(filteredData.length > 10 && index % Math.floor(filteredData.length / 5) !== 0) {
                return ''; // Mostra apenas algumas labels se houver muitos dados
            }
             const currentLocale = i18n.language === 'pt' ? ptBR : enUS;
             return format(data.date, 'dd/MM', { locale: currentLocale });
        });

        const datasets = [{
            data: filteredData.map(d => d.weight),
            color: (opacity = 1) => `rgba(174, 243, 89, ${opacity})`,
            strokeWidth: 3
        }];

        return { labels, datasets, isEmpty: false };

    }, [dailyLogs, activePeriod, i18n.language]);

    const hasDataForPeriod = useCallback((period: '1m' | '3m' | '6m' | '1a' | 'mais') => {
        if (!dailyLogs || Object.keys(dailyLogs).length === 0) return false;
        
        let startDate: Date;
        const today = startOfDay(new Date());

        switch (period) {
            case '1m': startDate = startOfDay(subMonths(today, 1)); break;
            case '3m': startDate = startOfDay(subMonths(today, 3)); break;
            case '6m': startDate = startOfDay(subMonths(today, 6)); break;
            case '1a': startDate = startOfDay(subYears(today, 1)); break;
            default: startDate = new Date(0); break;
        }

        return Object.keys(dailyLogs).some(dateString => {
            const logDate = parseISO(dateString);
            const weightValue = dailyLogs[dateString].weight;
            return (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) && typeof weightValue === 'number' && !isNaN(weightValue);
        });
    }, [dailyLogs]);

    useEffect(() => {
        if (!hasDataForPeriod(activePeriod)) {
            if (hasDataForPeriod('mais')) {
                setActivePeriod('mais');
            } else {
                setActivePeriod('1m');
            }
        }
    }, [activePeriod, hasDataForPeriod]);

    const translatedMetaAlimentar = useMemo(() => {
        if (!nutritionalGoals || !nutritionalGoals.macros || typeof nutritionalGoals.metaCalorias === 'undefined') {
            return [];
        }
        const { proteina, carboidratos, gordura } = nutritionalGoals.macros;
        const metaCalorias = nutritionalGoals.metaCalorias;
        const safeMetaCalorias = metaCalorias > 0 ? metaCalorias : 1;
        const calculatePercentage = (grams: number, caloriesPerGram: number) => {
            const caloriesFromMacro = grams * caloriesPerGram;
            return Math.min(100, Math.round((caloriesFromMacro / safeMetaCalorias) * 100));
        };

        return [
            { label: t('progress.proteins'), value: proteina, unit: 'g', percentage: calculatePercentage(proteina, 4), color: '#AEF359' },
            { label: t('progress.carbohydrates'), value: carboidratos, unit: 'g', percentage: calculatePercentage(carboidratos, 4), color: '#8BC34A' },
            { label: t('progress.healthy_fats'), value: gordura, unit: 'g', percentage: calculatePercentage(gordura, 9), color: '#689F38' },
        ];
    }, [nutritionalGoals, t]);

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#181917', '#020500']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('progress.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('progress.subtitle')}</Text>
                </View>

                <View style={styles.periodFilterContainer}>
                    {PERIODS.map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton, 
                                activePeriod === period && styles.periodButtonActive,
                                !hasAnyWeightData && styles.periodButtonDisabled
                            ]}
                            onPress={() => setActivePeriod(period)}
                            disabled={!hasAnyWeightData}
                            accessibilityLabel={t(`progress.${periodKeyMap[period]}`)}
                        >
                            <Text style={[
                                styles.periodButtonText, 
                                activePeriod === period && styles.periodButtonTextActive,
                                !hasAnyWeightData && styles.periodButtonTextDisabled
                            ]}>
                                {t(`progress.${periodKeyMap[period]}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.progressCard}>
                    {isLoadingWeightData ? (
                        <ActivityIndicator size="large" color="#AEF359" style={{ marginVertical: 50 }} />
                    ) : errorLoadingWeightData ? (
                        <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={40} color="#C62828" />
                        <Text style={styles.errorText}>{errorLoadingWeightData}</Text>
                        <TouchableOpacity onPress={fetchWeightData} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                        </TouchableOpacity>
                        </View>
                    ) : !hasAnyWeightData ? ( 
                        <View style={styles.noDataContainer}>
                            <MaterialIcons name="info-outline" size={30} color="#9E9E9E" />
                            <Text style={styles.noDataText}>{t('progress.no_weight_data')}</Text>
                            <Text style={styles.noDataText}>{t('progress.register_weight_daily')}</Text>
                        </View>
                    ) : chartWeightData.isEmpty ? (
                        <View style={styles.noDataContainer}>
                            <MaterialIcons name="info-outline" size={30} color="#9E9E9E" />
                            <Text style={styles.noDataText}>{t('progress.no_data_selected_period')}</Text>
                            <Text style={styles.noDataText}>{t('progress.try_other_period')}</Text>
                        </View>
                    ) : (
                        <>
                            <LineChart
                                data={chartWeightData}
                                width={width * 0.9 - 20} // Ajuste de largura
                                height={230}
                                chartConfig={CHART_CONFIG}
                                bezier
                                style={styles.chart}
                                fromZero
                            />

                            <View style={styles.divider} />
                            {isLoadingMacros ? (
                                <ActivityIndicator size="small" color="#AEF359" style={{ marginVertical: 20 }} />
                            ) : errorLoadingMacros ? (
                                <View style={styles.errorContainer}>
                                <MaterialIcons name="error-outline" size={30} color="#C62828" />
                                <Text style={styles.errorTextSmall}>{errorLoadingMacros}</Text>
                                <TouchableOpacity onPress={fetchNutritionalGoals} style={styles.retryButton}>
                                    <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                                </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                <Text style={styles.metaAlimentarTitle}>{t('progress.food_goal_title')}</Text>
                                {translatedMetaAlimentar.length > 0 ? (
                                    translatedMetaAlimentar.map((item, index) => (
                                    <View key={index} style={styles.metaItem}>
                                        <View style={styles.metaHeader}>
                                        <View style={styles.metaLabelContainer}>
                                            <View style={[styles.metaColorDot, { backgroundColor: item.color }]} />
                                            <Text style={styles.metaText}>{item.label}</Text>
                                        </View>
                                        <Text style={styles.metaValueText}>{item.value}{item.unit}</Text>
                                        </View>
                                        <View style={styles.progressBarBackground}>
                                        <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                                        </View>
                                    </View>
                                    ))
                                ) : (
                                    <View style={styles.noDataContainer}>
                                    <MaterialIcons name="info-outline" size={30} color="#9E9E9E" />
                                    <Text style={styles.noDataText}>{t('progress.no_nutritional_goals')}</Text>
                                    <Text style={styles.noDataText}>{t('progress.complete_profile_to_see_progress')}</Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('PerfilTab')}
                                        style={styles.retryButton}
                                    >
                                        <Text style={styles.retryButtonText}>{t('progress.define_goals')}</Text>
                                    </TouchableOpacity>
                                    </View>
                                )}
                                </>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#020500',
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 120,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    header: {
        marginBottom: 24,
        width: '100%',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#FFFFFF',
        lineHeight: 41,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#9E9E9E',
        marginTop: 4,
    },
    periodFilterContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        backgroundColor: '#181917',
        borderRadius: 50,
        padding: 4,
        width: '100%',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
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
    progressCard: {
        backgroundColor: '#181917',
        borderRadius: 24,
        paddingTop: 16,
        paddingBottom: 8,
        width: '100%',
        alignItems: 'center',
    },
    chart: {
        borderRadius: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 16,
        width: '90%',
    },
    metaAlimentarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 20,
        paddingHorizontal: 20,
        width: '100%',
    },
    metaItem: {
        marginBottom: 24,
        paddingHorizontal: 20,
        width: '100%',
    },
    metaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    metaLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    metaText: {
        fontSize: 16,
        color: '#E0E0E0',
        fontWeight: '500',
    },
    metaValueText: {
        fontSize: 14,
        color: '#BDBDBD',
        fontWeight: '600',
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#C62828',
        marginTop: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    errorTextSmall: {
        color: '#C62828',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
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
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        minHeight: 250,
    },
    noDataText: {
        color: '#9E9E9E',
        marginTop: 10,
        textAlign: 'center',
        fontSize: 16,
    },
});

export default ProgressoDetalhadoScreen;