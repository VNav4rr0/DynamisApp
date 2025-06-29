import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Animated,
    StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- Tipagem ---
// Ajuste a tipagem para MainTabParamList (igual à definida no App.tsx)
type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

// Ajuste ProgressoDetalhadoProps para usar MainTabParamList e a rota correta
type ProgressoDetalhadoProps = BottomTabScreenProps<MainTabParamList, 'ProgressoDetalhadoTab'>;

interface MetaAlimentarItem {
    label: string;
    value: number;
    unit: string;
    percentage: number;
    color: string;
}

// --- Dados de Exemplo ---
const getChartData = (period: '1m' | '3m' | '6m' | '1a' | 'mais') => {
    const dataPoints: Record<'1m' | '3m' | '6m' | '1a' | 'mais', number[]> = {
        '1m': [20, 45, 28, 80, 99, 43, 50],
        '3m': [60, 75, 48, 90, 85, 99, 70, 65, 88, 92, 78, 85],
        '6m': [55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110], // Exemplo de dados para 6 meses
        '1a': [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95], // Exemplo de dados para 1 ano
        'mais': [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85], // Exemplo de dados para 'mais'
    };
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    return {
        labels: labels.slice(0, dataPoints[period]?.length || labels.length), // Ajusta labels para o tamanho dos dados
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

const META_ALIMENTAR_DATA: MetaAlimentarItem[] = [
    { label: 'progress.proteins', value: 120, unit: 'g', percentage: 75, color: '#AEF359' },
    { label: 'progress.carbohydrates', value: 200, unit: 'g', percentage: 90, color: '#8BC34A' },
    { label: 'progress.healthy_fats', value: 50, unit: 'g', percentage: 60, color: '#689F38' },
];

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
    

    const translatedMetaAlimentar = useMemo(() => META_ALIMENTAR_DATA.map(item => ({ ...item, label: t(item.label) })), [t]);
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
                    {/* GRÁFICO COM SCROLL HORIZONTAL */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                            data={chartData}
                            width={width * 1.5} // Gráfico mais largo que a tela
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
                    {translatedMetaAlimentar.map((item, index) => (
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
                    ))}
                </View>
            </ScrollView>

            
        </View>
    );
};

// --- Estilos Refatorados (REMOVIDO ESTILOS DA NAVBAR) ---
const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#020500',
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 120, // Manter o paddingBottom para a navbar vinda do App.tsx
        paddingHorizontal: 20, // Adicionei padding horizontal para todo o conteúdo aqui
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
    // REMOVIDO TODOS OS ESTILOS DA NAVBAR DAQUI:
    // bottomNav, activeIndicator, navButtonContainer, navButton, navButtonContent, navText
});

export default ProgressoDetalhadoScreen;