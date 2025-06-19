import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const ProgressoDetalhado: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation(); // Removido 'i18n' pois não será mais usado para mudar o idioma aqui

  const [activePeriod, setActivePeriod] = useState<'1m' | '3m' | '6m' | '1a' | 'mais'>('1m');

  // ESTADO E ANIMAÇÃO DA BARRA DE NAVEGAÇÃO
  const [activeTab, setActiveTab] = useState<string>('insights');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const navButtonWidth = (width - 40) / 3;

  useEffect(() => {
    let toValue = 0;
    if (activeTab === 'insights') {
      toValue = navButtonWidth;
    } else if (activeTab === 'person') {
      toValue = navButtonWidth * 2;
    }

    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      bounciness: 10,
    }).start();
  }, [activeTab, navButtonWidth, slideAnim]);

  const chartData = {
    labels: ["", "", "", "", "", ""],
    datasets: [
      {
        data: [0, 35, 55, 73, 50, 25],
        color: (opacity = 1) => `rgba(154, 205, 50, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundColor: '#000',
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(154, 205, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    axisLineColor: `rgba(255, 255, 255, 1)`,
    gridColor: `rgba(255, 255, 255, 0.2)`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#9ACD32"
    },
    fillShadowGradient: '#9ACD32',
    fillShadowGradientOpacity: 0.5,
    fromZero: true,
    segments: 5,
  };

  const metaAlimentar = [
    { label: t('progress.proteins'), value: 120, unit: 'kg', percentage: 33, color: '#9ACD32' },
    { label: t('progress.carbohydrates'), value: 200, unit: 'kg', percentage: 54, color: '#FF7F50' },
    { label: t('progress.healthy_fats'), value: 50, unit: 'kg', percentage: 13, color: '#FF00FF' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* REMOVIDO: Seletor de idioma */}

        <View style={styles.header}>
          <Text style={[styles.headerTitle, styles.headerTitleFullGreen]}>{t('progress.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('progress.subtitle')}</Text>
        </View>

        <View style={styles.periodFilterContainer}>
          <TouchableOpacity
            style={[styles.periodButton, activePeriod === '1m' && styles.periodButtonActive]}
            onPress={() => setActivePeriod('1m')}>
            <Text style={[styles.periodButtonText, activePeriod === '1m' && styles.periodButtonTextActive]}>{t('progress.period_1month')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, activePeriod === '3m' && styles.periodButtonActive]}
            onPress={() => setActivePeriod('3m')}>
            <Text style={[styles.periodButtonText, activePeriod === '3m' && styles.periodButtonTextActive]}>{t('progress.period_3months')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, activePeriod === '6m' && styles.periodButtonActive]}
            onPress={() => setActivePeriod('6m')}>
            <Text style={[styles.periodButtonText, activePeriod === '6m' && styles.periodButtonTextActive]}>{t('progress.period_6months')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, activePeriod === '1a' && styles.periodButtonActive]}
            onPress={() => setActivePeriod('1a')}>
            <Text style={[styles.periodButtonText, activePeriod === '1a' && styles.periodButtonTextActive]}>{t('progress.period_1year')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, activePeriod === 'mais' && styles.periodButtonActive]}
            onPress={() => setActivePeriod('mais')}>
            <Text style={[styles.periodButtonText, activePeriod === 'mais' && styles.periodButtonTextActive]}>{t('progress.period_more')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withHorizontalLabels
            fromZero={true}
            segments={5}
          />
        </View>

        <View style={styles.metaAlimentarContainer}>
          <Text style={styles.metaAlimentarTitle}>{t('progress.food_goal_title')}</Text>
          {metaAlimentar.map((item, index) => (
            <View key={index} style={styles.metaItem}>
              <Text style={[styles.metaPercentage, { color: item.color }]}>{item.percentage}%</Text>
              <Text style={styles.metaText}>{item.label} - {item.value}{item.unit}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Animated.View style={[styles.activeIndicator, { left: slideAnim }]} />

        <View style={styles.navButtonContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              setActiveTab('home');
              navigation.navigate('Home');
            }}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="home" size={26} color={activeTab === 'home' ? '#000' : '#FFF'} />
              {activeTab === 'home' && <Text style={styles.navText}>{t('navbar.home')}</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              setActiveTab('insights');
            }}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="insights" size={26} color={activeTab === 'insights' ? '#000' : '#FFF'} />
              {activeTab === 'insights' && <Text style={styles.navText}>{t('navbar.goals')}</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              setActiveTab('person');
              navigation.navigate('Profile');
            }}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  // REMOVIDO: languageSwitcher styles
  // REMOVIDO: langButton styles
  // REMOVIDO: langButtonActive styles
  // REMOVIDO: langButtonText styles
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  headerTitleFullGreen: {
    color: '#9ACD32',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  periodFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    backgroundColor: '#1C1C1E',
    borderRadius: 25,
    padding: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#9ACD32',
  },
  periodButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#000',
  },
  chartContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  chart: {
    // Estilos adicionais para o gráfico se precisar
  },
  metaAlimentarContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  metaAlimentarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  metaPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 40,
  },
  metaText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    flex: 1,
    marginLeft: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

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

export default ProgressoDetalhado;