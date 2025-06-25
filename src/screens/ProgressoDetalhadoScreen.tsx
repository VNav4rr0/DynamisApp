import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
type RootTabParamList = {
    Home: undefined;
    ProgressoDetalhado: undefined;
    Perfil: undefined;
};

type ProgressoDetalhadoProps = BottomTabScreenProps<RootTabParamList, 'ProgressoDetalhado'>;

interface MetaAlimentarItem {
    label: string;
    value: number;
    unit: string;
    percentage: number;
    color: string;
}

// --- Dados de Exemplo ---
const getChartData = (period: '1m' | '3m' | '6m' | '1a' | 'mais') => {
    // Numa aplicação real, esta função faria uma chamada de API
    const dataPoints: Record<'1m' | '3m' | '6m' | '1a' | 'mais', number[]> = {
        '1m': [20, 45, 28, 80, 99, 43, 50],
        '3m': [60, 75, 48, 90, 85, 99, 70, 65, 88, 92, 78, 85],
        '6m': [], // ... dados para 6 meses ...
        '1a': [], // ... dados para 1 ano ...
        'mais': [], // ... todos os dados ...
    };
    // Adicionando mais labels para o scroll funcionar
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    return {
        labels: labels,
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
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
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

// ALTERAÇÃO: Cores das barras de progresso ajustadas para tons de verde.
const META_ALIMENTAR_DATA: MetaAlimentarItem[] = [
    { label: 'progress.proteins', value: 120, unit: 'g', percentage: 75, color: '#AEF359' }, // Verde principal
    { label: 'progress.carbohydrates', value: 200, unit: 'g', percentage: 90, color: '#8BC34A' }, // Verde secundário
    { label: 'progress.healthy_fats', value: 50, unit: 'g', percentage: 60, color: '#689F38' }, // Verde terciário
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
    const [activeTab, setActiveTab] = useState<string>('insights');
    
    const navButtonWidth = (width - 40) / 3;
    const slideAnim = useRef(new Animated.Value(navButtonWidth)).current;

    const handleTabPress = (tab: 'home' | 'insights' | 'person') => {
        setActiveTab(tab);
        if (tab === 'home') {
            navigation.navigate('Home');
        } else if (tab === 'person') {
            navigation.navigate('Perfil');
        }
    };

    useEffect(() => {
        let toValue = navButtonWidth;
        if (activeTab === 'home') {
            toValue = 0;
        } else if (activeTab === 'person') {
            toValue = navButtonWidth * 2;
        }
        
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: false,
            bounciness: 10,
        }).start();
    }, [activeTab]);


    const translatedMetaAlimentar = useMemo(() => META_ALIMENTAR_DATA.map(item => ({ ...item, label: t(item.label) })), [t]);
    const chartData = useMemo(() => getChartData(activePeriod), [activePeriod]);

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#111', '#000']} style={StyleSheet.absoluteFill} />

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
                            withVerticalLabels // Mostra os valores no eixo Y
                        />
                    </ScrollView>
                    <View style={styles.divider} />
                    <Text style={styles.metaAlimentarTitle}>{t('progress.food_goal_title')}</Text>
                    {translatedMetaAlimentar.map((item, index) => (
                        // LAYOUT DAS BARRAS DE PROGRESSO CORRIGIDO
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

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <Animated.View style={[styles.activeIndicator, { left: slideAnim }]} />
                <View style={styles.navButtonContainer}>
                    <TouchableOpacity style={styles.navButton} onPress={() => handleTabPress('home')} accessibilityLabel={t('navbar.home')}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="home" size={26} color={activeTab === 'home' ? '#000' : '#FFF'} />
                            {activeTab === 'home' && <Text style={styles.navText}>{t('navbar.home')}</Text>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => handleTabPress('insights')} accessibilityLabel={t('navbar.goals')}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="insights" size={26} color={activeTab === 'insights' ? '#000' : '#FFF'} />
                            {activeTab === 'insights' && <Text style={styles.navText}>{t('navbar.goals')}</Text>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => handleTabPress('person')} accessibilityLabel={t('navbar.profile')}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="person" size={26} color={activeTab === 'person' ? '#000' : '#FFF'} />
                            {activeTab === 'person' && <Text style={styles.navText}>{t('navbar.profile')}</Text>}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- Estilos Refatorados ---
const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 24,
        paddingHorizontal: 20,
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
        backgroundColor: '#1C1C1E',
        borderRadius: 50,
        padding: 4,
        marginHorizontal: 20,
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
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        marginHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        overflow: 'hidden', // Importante para o scroll do gráfico
    },
    chart: {
        paddingRight: 20, // Dá um respiro no final do gráfico
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
    // ESTILOS DAS BARRAS DE PROGRESSO CORRIGIDOS
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
    // Estilos da Navbar
    bottomNav: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        height: 65,
        backgroundColor: '#1C1C1E',
        borderRadius: 32.5,
        flexDirection: 'row',
    },
    activeIndicator: {
        position: 'absolute',
        top: 7.5,
        height: 50,
        width: ((width - 40) / 3) - 10,
        marginHorizontal: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
    },
    navButtonContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    navButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    navText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ProgressoDetalhadoScreen;
