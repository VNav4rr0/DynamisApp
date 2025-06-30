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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

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

const getChartData = (period: '1m' | '3m' | '6m' | '1a' | 'mais') => {
    const dataPoints: Record<'1m' | '3m' | '6m' | '1a' | 'mais', number[]> = {
        '1m': [20, 45, 28, 80, 99, 43, 50],
        '3m': [60, 75, 48, 90, 85, 99, 70, 65, 88, 92, 78, 85],
        '6m': [55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110],
        '1a': [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
        'mais': [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    };
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    return {
        labels: labels.slice(0, dataPoints[period]?.length || labels.length),
        datasets: [
            {
                data: dataPoints[period] && dataPoints[period].length > 0 ? dataPoints[period] : dataPoints['1m'],
                color: (opacity = 1) => `rgba(174, 243, 89, ${opacity})`,
                strokeWidth: 3
            }
        ]
    };
};

const CHART_CONFIG = {
    backgroundGradientFrom: '#181917',
    backgroundGradientTo: '#181917',
    decimalPlaces: 0,
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

const PERIODS: Array<'1m' | '3m' | '6m' | '1a' | 'mais'> = ['1m', '3m', '6m', '1a', 'mais']; // Corrigi o tipo '3m | 6m...'
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

    const fetchNutritionalGoals = useCallback(async () => {
        setIsLoadingMacros(true);
        setErrorLoadingMacros(null);
        const user = auth.currentUser;

        console.log("ProgressoDetalhado: Iniciando busca de macros.");

        if (!user) {
            console.error("ProgressoDetalhado: Usuário não logado para buscar macros. Redirecionando ou exibindo erro.");
            setErrorLoadingMacros("Você precisa estar logado para ver seus dados nutricionais.");
            setIsLoadingMacros(false);
            // navigation.replace('BoasVindasScreen'); // Comentar ou ativar se quiser redirecionar aqui
            return;
        }

        console.log("ProgressoDetalhado: UID do usuário logado:", user.uid);

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log("ProgressoDetalhado: Dados completos do usuário do Firestore:", userData);

                if (userData.calculosNutricionais) {
                    setNutritionalGoals(userData.calculosNutricionais as UserNutritionalGoals);
                    console.log("ProgressoDetalhado: 'calculosNutricionais' encontrado e carregado:", userData.calculosNutricionais);
                    if (!userData.calculosNutricionais.macros || typeof userData.calculosNutricionais.metaCalorias === 'undefined') {
                        console.warn("ProgressoDetalhado: 'macros' ou 'metaCalorias' ausente em calculosNutricionais.");
                        setErrorLoadingMacros("Dados nutricionais incompletos. Por favor, recalcule suas metas.");
                    }
                } else {
                    console.log("ProgressoDetalhado: 'calculosNutricionais' não encontrado no documento do usuário.");
                    setErrorLoadingMacros("Dados nutricionais não calculados. Por favor, complete seu cadastro.");
                }
            } else {
                console.log("ProgressoDetalhado: Documento do usuário não encontrado no Firestore para UID:", user.uid);
                setErrorLoadingMacros("Seu perfil não foi encontrado. Faça login novamente.");
            }
        } catch (error: any) {
            console.error("ProgressoDetalhado: ERRO FATAL ao buscar dados nutricionais do Firestore:", error);
            if (error.code === 'permission-denied') {
                setErrorLoadingMacros("Erro de permissão. Verifique suas regras do Firebase.");
            } else {
                setErrorLoadingMacros("Erro ao carregar dados nutricionais. Verifique sua conexão e tente novamente.");
            }
        } finally {
            setIsLoadingMacros(false);
            console.log("ProgressoDetalhado: Finalizado carregamento de macros. isLoadingMacros:", false);
        }
    }, []);

    useEffect(() => {
        fetchNutritionalGoals();
    }, [fetchNutritionalGoals]);

    const translatedMetaAlimentar = useMemo(() => {
        if (!nutritionalGoals || !nutritionalGoals.macros || typeof nutritionalGoals.metaCalorias === 'undefined') {
            console.log("ProgressoDetalhado: Não há dados nutricionais ou estão incompletos para exibir as barras.");
            return [];
        }

        const { proteina, carboidratos, gordura } = nutritionalGoals.macros;
        const metaCalorias = nutritionalGoals.metaCalorias;

        const safeMetaCalorias = metaCalorias > 0 ? metaCalorias : 1;

        const calculatePercentage = (grams: number, caloriesPerGram: number) => {
            const caloriesFromMacro = grams * caloriesPerGram;
            return Math.min(100, Math.round((caloriesFromMacro / safeMetaCalorias) * 100));
        };

        const macrosData = [
            { label: t('progress.proteins'), value: proteina, unit: 'g', percentage: calculatePercentage(proteina, 4), color: '#AEF359' },
            { label: t('progress.carbohydrates'), value: carboidratos, unit: 'g', percentage: calculatePercentage(carboidratos, 4), color: '#8BC34A' },
            { label: 'progress.healthy_fats', value: gordura, unit: 'g', percentage: calculatePercentage(gordura, 9), color: '#689F38' },
        ];
        console.log("ProgressoDetalhado: Macros processados para exibição:", macrosData);
        return macrosData;
    }, [nutritionalGoals, t]);

    const chartData = useMemo(() => getChartData(activePeriod), [activePeriod]);

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
                            style={[styles.periodButton, activePeriod === period && styles.periodButtonActive]}
                            onPress={() => setActivePeriod(period)}
                            accessibilityLabel={t(`progress.${periodKeyMap[period]}`)}
                        >
                            <Text style={[styles.periodButtonText, activePeriod === period && styles.periodButtonTextActive]}>
                                {t(`progress.${periodKeyMap[period]}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Card Unificado de Progresso */}
                <View style={styles.progressCard}>
                    {isLoadingMacros ? (
                        <ActivityIndicator size="large" color="#AEF359" style={{ marginVertical: 50 }} />
                    ) : errorLoadingMacros ? (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={40} color="#C62828" />
                            <Text style={styles.errorText}>{errorLoadingMacros}</Text>
                            <TouchableOpacity onPress={fetchNutritionalGoals} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* GRÁFICO COM SCROLL HORIZONTAL */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScrollView}> {/* Adicionado estilo aqui */}
                                <LineChart
                                    data={chartData}
                                    width={width * 1.5}
                                    height={230}
                                    chartConfig={CHART_CONFIG}
                                    bezier
                                    style={styles.chart}
                                    fromZero
                                    withVerticalLabels
                                />
                            </ScrollView>
                            <View style={styles.divider} />
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
                                </View>
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
    progressCard: {
        backgroundColor: '#181917',
        borderRadius: 24,
        paddingTop: 16,
        paddingBottom: 8,
        overflow: 'hidden',
    },
    chartScrollView: { // NOVO ESTILO: Para o ScrollView do gráfico
        paddingLeft: 20, // Ajusta o padding do início do gráfico
    },
    chart: {
        paddingRight: 20, // Continua dando espaço no final
        // O paddingLeft do LineChart não funcionou bem com o scroll, então o ScrollView pai cuida.
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