import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const refeicoes = [
  { nome: 'Café da Manhã', icone: 'coffee' },
  { nome: 'Almoço', icone: 'silverware-fork-knife' },
  { nome: 'Café da Tarde', icone: 'coffee' },
  { nome: 'Jantar', icone: 'silverware-fork-knife' },
  { nome: 'Ceia', icone: 'pine-tree' },
];

const PERIODS = ['1m', '3m', '6m', '1a', 'mais'];
const PERIOD_LABELS = {
  '1m': '1 mês',
  '3m': '3 meses',
  '6m': '6 meses',
  '1a': '1 ano',
  'mais': 'Mais',
};

const getChartData = (period) => {
  const dataPoints = {
    '1m': [2, 5, 3, 3, 6, 8, 9],
    '3m': [3, 4, 3, 7, 6, 8, 7, 8, 9, 6, 7, 8],
    '6m': [4, 5, 6, 5, 6, 7],
    '1a': [2, 4, 5, 3, 6, 7, 8, 5, 6, 7, 8, 9],
    'mais': [2, 3, 4, 5, 6, 7],
  };

  return {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
    datasets: [
      {
        data: dataPoints[period] || dataPoints['1m'],
        color: () => '#AEF359',
        strokeWidth: 3,
      },
    ],
  };
};

const chartConfig = {
  backgroundGradientFrom: '#1C1C1E',
  backgroundGradientTo: '#1C1C1E',
  color: () => '#AEF359',
  labelColor: () => 'rgba(255, 255, 255, 0.5)',
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#AEF359',
  },
  propsForBackgroundLines: {
    stroke: 'rgba(255, 255, 255, 0.1)',
  },
  fillShadowGradient: '#AEF359',
  fillShadowGradientOpacity: 0.2,
};

const NutricionistaScreen = () => {
  const [activePeriod, setActivePeriod] = useState('1m');
  const [selectedDay, setSelectedDay] = useState(0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/background_nutri.png')} style={styles.headerImage} resizeMode="cover" />
        <View style={styles.headerOverlay}></View>
      </View>

      <Text style={styles.title}>Olá, Nutricionista</Text>
      <Text style={styles.subtitle}>
        Sessão de edição ativa para: <Text style={{ fontWeight: 'bold' }}>João Felix</Text>. As suas alterações são visíveis apenas para este utilizador
      </Text>

      <View style={styles.periodSelector}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setActivePeriod(p)}
            style={[styles.periodButton, activePeriod === p && styles.periodButtonActive]}
          >
            <Text style={[styles.periodButtonText, activePeriod === p && styles.periodButtonTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          data={getChartData(activePeriod)}
          width={width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          fromZero
          withVerticalLabels
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Divisão das Refeições</Text>
        <Text style={styles.sectionSubtitle}>
          Adicione os alimentos, quantidades e horários para cada refeição
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekDaysContainer}
      >
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedDay(index)}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
            ]}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === index && styles.dayButtonTextActive,
              ]}
            >
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
                <MaterialCommunityIcons name={ref.icone} size={20} color="#FFF" />
              </View>
              <Text style={styles.cardTitle}>{ref.nome}</Text>
            </View>
            <TextInput
              placeholder="Adicionar descrição alimentar..."
              placeholderTextColor="#bbb"
              style={styles.inputBox}
              multiline
            />
            <TouchableOpacity style={styles.cardButton}>
              <MaterialCommunityIcons name="playlist-plus" size={18} color="#000" />
              <Text style={styles.buttonText}>Adicionar Plano</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* AVISOS IMPORTANTES COM ÍCONE */}
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
        />
        <TouchableOpacity style={styles.cardButton}>
          <MaterialCommunityIcons name="bell-plus" size={18} color="#000" />
          <Text style={styles.buttonText}>Adicionar Aviso</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Este acesso é permanente. Ao sair, precisará do mesmo código para continuar a editar o plano deste paciente.
      </Text>

      <TouchableOpacity style={styles.logoutButton}>
        <MaterialCommunityIcons name="logout" size={18} color="#AEF359" />
        <Text style={styles.logoutText}>Sair da Conta</Text>
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
    height: 200,
    width: 450,
    justifyContent: 'flex-end',
    paddingBottom: 34,
    left: -20,
  },
  headerImage: {
    marginBottom: -50,
    position: 'absolute',
    width: '100%',
    height: '150%',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 10,
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
    marginBottom: -100,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 50,
    padding: 4,
    marginTop: 160,
    justifyContent: 'space-between',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
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
  chartWrapper: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 20,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginRight: 10,
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
  horizontalScroll: {
    paddingVertical: 12,
  },
  card: {
    width: width * 0.6,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    backgroundColor: '#AEF359',
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
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    
  },
  logoutButton: {
    marginTop: 16,
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
});

export default NutricionistaScreen;
