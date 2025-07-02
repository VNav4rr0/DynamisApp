import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Animated,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subMonths, subYears, isAfter, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns'; // Adicionado startOfDay, endOfDay
import { ptBR } from 'date-fns/locale';

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
    yAxisLabel: 'kg',
    formatYLabel: (yLabel: string) => parseFloat(yLabel).toFixed(1),
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
    const { t } = useTranslation();
    const [activePeriod, setActivePeriod] = useState<'1m' | '3m' | '6m' | '1a' | 'mais'>('1m');

    const [nutritionalGoals, setNutritionalGoals] = useState<UserNutritionalGoals | null>(null);
    const [isLoadingMacros, setIsLoadingMacros] = useState(true);
    const [errorLoadingMacros, setErrorLoadingMacros] = useState<string | null>(null);

    const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLogEntry> | null>(null);
    const [pesoMeta, setPesoMeta] = useState<number | null>(null);
    const [isLoadingWeightData, setIsLoadingWeightData] = useState(true);
    const [errorLoadingWeightData, setErrorLoadingWeightData] = useState<string | null>(null);
    
    // NOVO ESTADO: Para saber se há algum dado de peso no geral
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
                
                // Carregar dailyLogs
                if (userData.dailyLogs && Object.keys(userData.dailyLogs).length > 0) {
                    setDailyLogs(userData.dailyLogs as Record<string, DailyLogEntry>);
                    setHasAnyWeightData(true); // Marca que há dados de peso
                } else {
                    setDailyLogs({}); // Inicializa como objeto vazio se não houver logs
                    setHasAnyWeightData(false); // Nenhhum dado de peso
                }

                // Carregar peso meta
                if (userData.metas && userData.metas.pesoMeta) {
                    setPesoMeta(Number(userData.metas.pesoMeta));
                } else {
                    setPesoMeta(null); // Nenhuma meta de peso
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

    // Processamento de dados para o gráfico de peso
    const chartWeightData = useMemo(() => {
        // Se não há dados, retorna um estado de gráfico vazio
        if (!dailyLogs || Object.keys(dailyLogs).length === 0) {
            return {
                labels: [],
                datasets: [{ data: [] }],
                chartWidth: width * 0.9,
                isEmpty: true // Marcador para indicar que não há dados para o gráfico
            };
        }

        const sortedDates = Object.keys(dailyLogs).sort();
        let filteredWeights: number[] = [];
        let labels: string[] = [];
        let startDate: Date;

        const today = startOfDay(new Date()); // Usar o início do dia para consistência

        // Define a data de início com base no período selecionado
        switch (activePeriod) {
            case '1m': startDate = startOfDay(subMonths(today, 1)); break;
            case '3m': startDate = startOfDay(subMonths(today, 3)); break;
            case '6m': startDate = startOfDay(subMonths(today, 6)); break;
            case '1a': startDate = startOfDay(subYears(today, 1)); break;
            case 'mais': startDate = new Date(0); break; // Começa de uma data bem antiga
        }

        // Filtra os logs de peso pelo período
        for (const dateString of sortedDates) {
            const logDate = parseISO(dateString);
            if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
                const weightValue = dailyLogs[dateString].weight;
                if (typeof weightValue === 'number' && !isNaN(weightValue)) {
                    filteredWeights.push(weightValue);
                    // Usar 'dd/MM' para 1m, 'MMM' para mais de 1m, 'MMM/yy' para 1a+
                    if (activePeriod === '1m') {
                        labels.push(format(logDate, 'dd/MM', { locale: ptBR }));
                    } else if (activePeriod === '3m' || activePeriod === '6m') {
                        labels.push(format(logDate, 'MMM', { locale: ptBR }));
                    } else {
                        labels.push(format(logDate, 'MMM/yy', { locale: ptBR }));
                    }
                }
            }
        }

        // Adiciona a meta de peso como uma segunda linha, se houver dados de peso para plotar
        const datasets = [
            {
                data: filteredWeights,
                color: (opacity = 1) => `rgba(174, 243, 89, ${opacity})`,
                strokeWidth: 3,
            }
        ];

        if (pesoMeta !== null && typeof pesoMeta === 'number' && filteredWeights.length > 0) {
            // A linha de meta só aparece se houver dados reais de peso para o período
            datasets.push({
                data: Array(filteredWeights.length).fill(pesoMeta),
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Linha branca para a meta
                strokeWidth: 1,
            });
        }
        
        // Se não houver dados de peso filtrados para o período, indica que está vazio
        if (filteredWeights.length === 0) {
             return {
                labels: [],
                datasets: [{ data: [] }],
                chartWidth: width * 0.9,
                isEmpty: true
            };
        }

        // Ajustar a largura do gráfico se houver muitos pontos
        // Mínimo 90% da tela, ou 50px por ponto para evitar amontoamento
        const chartWidth = Math.max(width * 0.9 - 40, labels.length * 50); // -40 para padding do card

        return { labels, datasets, chartWidth, isEmpty: false };

    }, [dailyLogs, pesoMeta, activePeriod, width]); // Dependências

    // Verifica se há dados de peso para um período específico
    const hasDataForPeriod = useCallback((period: '1m' | '3m' | '6m' | '1a' | 'mais') => {
        if (!dailyLogs || Object.keys(dailyLogs).length === 0) {
            return false;
        }
        let startDate: Date;
        const today = startOfDay(new Date());

        switch (period) {
            case '1m': startDate = startOfDay(subMonths(today, 1)); break;
            case '3m': startDate = startOfDay(subMonths(today, 3)); break;
            case '6m': startDate = startOfDay(subMonths(today, 6)); break;
            case '1a': startDate = startOfDay(subYears(today, 1)); break;
            case 'mais': startDate = new Date(0); break;
        }

        // Verifica se existe ao menos um log de peso após a data de início
        for (const dateString of Object.keys(dailyLogs)) {
            const logDate = parseISO(dateString);
            if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
                if (typeof dailyLogs[dateString].weight === 'number' && !isNaN(dailyLogs[dateString].weight)) {
                    return true;
                }
            }
        }
        return false;
    }, [dailyLogs]);

    // Redefine activePeriod se o atual não tiver dados
    useEffect(() => {
        if (!hasDataForPeriod(activePeriod)) {
            // Se o período ativo não tem dados, tenta encontrar o período 'mais' ou '1m'
            if (hasDataForPeriod('mais')) {
                setActivePeriod('mais');
            } else {
                setActivePeriod('1m'); // Cairá no noDataContainer se não houver dados em 'mais' também
            }
        }
    }, [activePeriod, hasDataForPeriod]); // Quando activePeriod ou hasDataForPeriod muda


    // Dados de Meta Alimentar (macros)
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
            { label: 'progress.healthy_fats', value: gordura, unit: 'g', percentage: calculatePercentage(gordura, 9), color: '#689F38' },
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

                {/* Filtro de Período Redesenhado */}
                <View style={styles.periodFilterContainer}>
                    {PERIODS.map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton, 
                                activePeriod === period && styles.periodButtonActive,
                                !hasAnyWeightData && styles.periodButtonDisabled // Desabilita se não tiver NENHUM dado
                            ]}
                            onPress={() => setActivePeriod(period)}
                            disabled={!hasAnyWeightData} // Desabilita o botão de filtro se não houver dados
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

                {/* Card Unificado de Progresso */}
                <View style={styles.progressCard}>
                    {isLoadingWeightData ? (
                        <ActivityIndicator size="large" color="#AEF359" style={{ marginVertical: 50 }} />
                    ) : errorLoadingWeightData ? (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={40} color="#C62828" />
                            <Text style={styles.errorText}>{errorLoadingWeightData}</Text>
                            <TouchableOpacity onPress={fetchWeightData} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : hasAnyWeightData === false ? ( // Caso não tenha NENHUM dado de peso
                        <View style={styles.noDataContainer}>
                            <MaterialIcons name="info-outline" size={30} color="#9E9E9E" />
                            <Text style={styles.noDataText}>Nenhum dado de peso encontrado.</Text>
                            <Text style={styles.noDataText}>Registre seu peso diariamente na Home para ver sua evolução!</Text>
                        </View>
                    ) : chartWeightData.isEmpty ? ( // Caso tenha dados gerais, mas não para o período selecionado
                         <View style={styles.noDataContainer}>
                            <MaterialIcons name="info-outline" size={30} color="#9E9E9E" />
                            <Text style={styles.noDataText}>Nenhum dado de peso para o período selecionado.</Text>
                            <Text style={styles.noDataText}>Tente outro período ou registre mais dados.</Text>
                        </View>
                    ) : (
                        <>
                            {/* GRÁFICO COM SCROLL HORIZONTAL */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScrollView}>
                                <LineChart
                                    data={{
                                        labels: chartWeightData.labels,
                                        datasets: chartWeightData.datasets,
                                    }}
                                    width={chartWeightData.chartWidth} // Largura dinâmica
                                    height={230}
                                    chartConfig={CHART_CONFIG}
                                    bezier
                                    style={styles.chart}
                                    // fromZero // Remover fromZero se o peso não pode ser 0
                                    withVerticalLabels
                                    withHorizontalLabels
                                    segments={5}
                                />
                            </ScrollView>

                            {/* Seção de Metas Alimentares (Macros) */}
                            <View style={styles.divider} />
                            {isLoadingMacros ? (
                                <ActivityIndicator size="small" color="#AEF359" style={{ marginVertical: 20 }} />
                            ) : errorLoadingMacros ? (
                                <View style={styles.errorContainer}>
                                    <MaterialIcons name="error-outline" size={30} color="#C62828" />
                                    <Text style={styles.errorTextSmall}>{errorLoadingMacros}</Text>
                                    <TouchableOpacity onPress={fetchNutritionalGoals} style={styles.retryButton}>
                                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
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
                                            <Text style={styles.noDataText}>Nenhuma meta nutricional encontrada.</Text>
                                            <Text style={styles.noDataText}>Complete seu cadastro para ver este progresso!</Text>
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate('PerfilTab')}
                                                style={styles.retryButton}
                                            >
                                                <Text style={styles.retryButtonText}>Definir Metas</Text>
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
    },
    header: {
        marginBottom: 24,
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
    periodButtonDisabled: { // Novo estilo para botões de período desabilitados
        opacity: 0.5,
    },
    periodButtonTextDisabled: { // Novo estilo para texto de botões de período desabilitados
        color: '#888',
    },
    progressCard: {
        backgroundColor: '#181917',
        borderRadius: 24,
        paddingTop: 16,
        paddingBottom: 8,
        overflow: 'hidden',
    },
    chartScrollView: {
        paddingLeft: 20,
    },
    chart: {
        paddingRight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 16,
        marginHorizontal: 20,
    },
    metaAlimentarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    metaItem: {
        marginBottom: 24,
        paddingHorizontal: 20,
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
        padding: 20,
    },
    noDataText: {
        color: '#9E9E9E',
        marginTop: 10,
        textAlign: 'center',
        fontSize: 16,
    },
});

export default ProgressoDetalhadoScreen;