import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface DayButtonProps {
  day: string;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

const DayButton: React.FC<DayButtonProps> = ({ day, label, isActive, isCompleted, onPress }) => (
  <TouchableOpacity style={styles.dayButton} onPress={onPress}>
    <View style={[
      styles.dayButtonContent, 
      isActive && !isCompleted && styles.dayButtonActive,
      isCompleted && styles.dayButtonCompleted
    ]}>
      <Text style={[
        styles.dayButtonIcon, 
        (isActive || isCompleted) && styles.dayButtonIconActive
      ]}>🔥</Text>
    </View>
    <Text style={[
      styles.dayButtonLabel,
      isCompleted && styles.dayButtonLabelCompleted
    ]}>{label}</Text>
  </TouchableOpacity>
);

const DynamisScreen: React.FC = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<string[]>(['Seg']); // Dias que já foram confirmados

  const days = [
    { day: 'Seg', label: 'Seg' },
    { day: 'Ter', label: 'Ter' },
    { day: 'Qua', label: 'Qua' },
    { day: 'Qui', label: 'Qui' },
    { day: 'Sex', label: 'Sex' },
    { day: 'Sab', label: 'Sab' },
    { day: 'Dom', label: 'Dom' },
  ];

  const handleDayPress = (day: string) => {
    // Não faz nada, apenas visual
  };

  const handleConfirmGoal = () => {
    const currentDay = days[currentDayIndex].day;
    
    if (!completedDays.includes(currentDay)) {
      setCompletedDays(prev => [...prev, currentDay]);
      setCurrentStreak(prev => prev + 1);
    }
    
    // Avança para o próximo dia
    setCurrentDayIndex(prev => (prev + 1) % 7);
    console.log('Meta diária confirmada!');
  };

  const handleRegisterMentor = () => {
    console.log('Cadastrar Mentor pressionado');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background com imagem */}
      <ImageBackground 
        source={{ uri: 'sua_imagem_aqui' }} // Substitua pela sua imagem
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay escuro */}
        <View style={styles.overlay} />
        
        {/* Header com logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>Dynamis ⚡</Text>
        </View>

        {/* Texto principal com gradiente dourado */}
        <View style={styles.mainTextContainer}>
          <Text style={styles.mainText}>
            Cada passo te{'\n'}
            aproxima <Text style={styles.goldText}>do seu{'\n'}
            objetivo!</Text>
          </Text>
        </View>

        {/* Seção de sequência */}
        <View style={styles.sequenceContainer}>
          <View style={styles.sequenceHeader}>
            <Text style={styles.sequenceTitle}>Sua Sequência</Text>
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>+ 320 kcal</Text>
              <View style={styles.fireContainer}>
                <Text style={styles.fireIcon}>🔥</Text>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
              </View>
            </View>
          </View>

          {/* Dias da semana */}
          <View style={styles.daysContainer}>
            {days.map((dayItem, index) => (
              <DayButton
                key={dayItem.day}
                day={dayItem.day}
                label={dayItem.label}
                isActive={index === currentDayIndex}
                isCompleted={completedDays.includes(dayItem.day)}
                onPress={() => handleDayPress(dayItem.day)}
              />
            ))}
          </View>
        </View>

        {/* Botão Confirmar Meta Diária */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmGoal}>
          <LinearGradient
            colors={['#9ACD32', '#7CB342']}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonIcon}>🔥</Text>
            <Text style={styles.confirmButtonText}>Confirmar Meta Diária</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Card de cadastro de mentor */}
        <View style={styles.mentorCard}>
          <LinearGradient
            colors={['#9ACD32', '#7CB342']}
            style={styles.mentorCardGradient}
          >
            <Text style={styles.mentorCardLogo}>Dynamis ⚡</Text>
            <Text style={styles.mentorCardText}>
              Cadastre seu Nutricionista ou Personal e{'\n'}
              melhore sua rotina com <Text style={styles.mentorCardBold}>DYNAMIS</Text>
            </Text>
            <TouchableOpacity style={styles.mentorButton} onPress={handleRegisterMentor}>
              <Text style={styles.mentorButtonText}>Cadastrar Mentor</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIcon}>🏠</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIcon}>📈</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9ACD32',
  },
  mainTextContainer: {
    paddingHorizontal: 20,
    marginBottom: 60,
  },
  mainText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  goldText: {
    color: '#FFD700',
  },
  sequenceContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sequenceTitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(154, 205, 50, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  fireIcon: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: 16,
    color: '#9ACD32',
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dayButton: {
    alignItems: 'center',
    gap: 8,
  },
  dayButtonContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: 'rgba(154, 205, 50, 0.3)',
    borderWidth: 2,
    borderColor: '#9ACD32',
  },
  dayButtonCompleted: {
    backgroundColor: '#9ACD32',
  },
  dayButtonIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  dayButtonIconActive: {
    opacity: 1,
  },
  dayButtonLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  dayButtonLabelCompleted: {
    color: '#9ACD32',
    fontWeight: 'bold',
  },
  confirmButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 25,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonIcon: {
    fontSize: 20,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  mentorCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mentorCardGradient: {
    padding: 20,
  },
  mentorCardLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  mentorCardText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    lineHeight: 20,
  },
  mentorCardBold: {
    fontWeight: 'bold',
  },
  mentorButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mentorButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingVertical: 15,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
  },
});

export default DynamisScreen;