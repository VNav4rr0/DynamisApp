import React, { useState, useRef, useEffect } from 'react'; // CORREÇÃO 2
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Image,
  ImageBackground,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

const { width } = Dimensions.get('window');

// --- Componentes DayButton e interface permanecem os mesmos ---
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
      <MaterialCommunityIcons
        name="fire"
        size={20}
        color={isCompleted ? '#000' : '#FFF'} // Ícone preto no fundo verde, branco nos outros
        style={[
          styles.dayButtonIcon,
          (isActive || isCompleted) && styles.dayButtonIconActive
        ]}
      />
    </View>
    <Text style={[
      styles.dayButtonLabel,
      isCompleted && styles.dayButtonLabelCompleted
    ]}>{label}</Text>
  </TouchableOpacity>
);


const HomeScreen: React.FC = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<string[]>(['Seg']);

  const [isModalVisible, setModalVisible] = useState(false);
  const [calories, setCalories] = useState('');
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');

  const [activeTab, setActiveTab] = useState<string>('home');


  const slideAnim = useRef(new Animated.Value(0)).current;
  const navButtonWidth = (width - 40) / 3;


  const [modalSubtitle, setModalSubtitle] = useState(''); // Estado para a frase



  useEffect(() => {
    let toValue = 0;
    if (activeTab === 'insights') {
      toValue = navButtonWidth;
    } else if (activeTab === 'person') {
      toValue = navButtonWidth * 2;
    }

    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false, // 'left' não é suportado pelo driver nativo
      bounciness: 10,
    }).start();
  }, [activeTab, navButtonWidth, slideAnim]); // Adicionei as dependências corretas aqui


  const days = [
    { day: 'Seg', label: 'Seg' }, { day: 'Ter', label: 'Ter' },
    { day: 'Qua', label: 'Qua' }, { day: 'Qui', label: 'Qui' },
    { day: 'Sex', label: 'Sex' }, { day: 'Sab', label: 'Sab' },
    { day: 'Dom', label: 'Dom' },
  ];

  const handleDayPress = (day: string) => { /* Apenas visual */ };

  // Frases motivacionais para exibir no modal
  const motivationalPhrases = [
    "Continue firme, cada dia conta!",
    "Você está mais perto do seu objetivo!",
    "A disciplina te leva longe!",
    "Ótimo trabalho, siga assim!",
    "Pequenas conquistas geram grandes resultados!",
    "Seu esforço vale a pena!",
    "Persistência é a chave do sucesso!"
  ];

  const openModal = () => {
    const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
    setModalSubtitle(motivationalPhrases[randomIndex]);
    setModalVisible(true);
  };
  // Dentro de DynamisScreen, adicione estas duas linhas:

  const [playFireAnimation, setPlayFireAnimation] = useState(false);
  const fireAnimation = useRef(new Animated.Value(1)).current; // Começa com escala 1 (tamanho normal)


  // Adicione este novo bloco useEffect dentro de DynamisScreen

  useEffect(() => {
    // Se o gatilho for ativado...
    if (playFireAnimation) {
      // Começa a sequência de animação
      Animated.sequence([
        // 1. Aumenta o tamanho do ícone
        Animated.timing(fireAnimation, {
          toValue: 1.6, // Aumenta para 160% do tamanho
          duration: 300,
          useNativeDriver: true, // Animação mais performática
        }),
        // 2. Volta ao tamanho normal
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. Desativa o gatilho para poder ser usado de novo
        setPlayFireAnimation(false);
      });
    }
  }, [playFireAnimation, fireAnimation]);

  // Encontre sua função handleSaveData e adicione a linha no final

  const handleSaveData = () => {
    console.log('Dados Salvos:', { calories, weight, water });

    const currentDay = days[currentDayIndex % 7].day;

    if (!completedDays.includes(currentDay)) {
      setCompletedDays(prev => [...prev, currentDay]);
      setCurrentStreak(prev => prev + 1);

      // PASSO 3: Ative o gatilho da animação aqui!
      setPlayFireAnimation(true);
    }

    setCurrentDayIndex(prev => (prev + 1) % 7);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCalories('');
    setWeight('');
    setWater('');
  };

  const handleRegisterMentor = () => {
    console.log('Cadastrar Mentor pressionado');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Modal
        animationType="slide" // MODIFICADO
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={handleCloseModal}
        >
          {/* MODIFICADO: Adicionado TouchableWithoutFeedback para não fechar ao tocar no modal */}
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalGrabber} />
            <Text style={styles.modalTitle}>Atualize seu Progresso</Text>
            <Text style={styles.modalSubtitle}>{modalSubtitle}</Text>

            {/* MODIFICADO: Inputs com ícones */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="fire" size={22} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.inputField} placeholder="Calorias consumidas (kcal)" placeholderTextColor="#888" keyboardType="numeric" value={calories} onChangeText={setCalories} />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="scale-bathroom" size={22} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.inputField} placeholder="Seu peso de hoje (kg)" placeholderTextColor="#888" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="water-drop" size={22} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.inputField} placeholder="Água ingerida (L)" placeholderTextColor="#888" keyboardType="decimal-pad" value={water} onChangeText={setWater} />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonSave} onPress={handleSaveData}>
                <Text style={styles.modalButtonTextSave}>Salvar Progresso</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={handleCloseModal}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <ImageBackground source={require('../../assets/mulher.png')} style={styles.coverSection}>
          <View style={styles.header}>
            <Image source={require('../../assets/Logotipo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.mainTextContainer}>
            <Text style={styles.mainText}>
              Cada passo te{'\n'}
              aproxima <Text style={styles.goldText}>do seu{'\n'}
                objetivo!</Text>
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.mainContent}>
          <View style={styles.sequenceContainer}>
            <View style={styles.sequenceHeader}>
              <Text style={styles.sequenceTitle}>Sua Sequência</Text>
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>+ 320 kcal</Text>
                <View style={styles.fireContainer}>
                  
                  <Animated.View style={{ transform: [{ scale: fireAnimation }] }}>
                    <MaterialCommunityIcons name="fire" size={16} color="#9ACD32" />
                  </Animated.View>
                  <Text style={styles.streakNumber}>{currentStreak}</Text>
                </View>
              </View>
            </View>
            <View style={styles.daysContainer}>
              {days.map((dayItem, index) => (
                <DayButton key={dayItem.day} day={dayItem.day} label={dayItem.label} isActive={index === currentDayIndex} isCompleted={completedDays.includes(dayItem.day)} onPress={() => handleDayPress(dayItem.day)} />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={openModal}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#1C1C1E" />
            <Text style={styles.confirmButtonText}>Confirmar Meta Diária</Text>
          </TouchableOpacity>

          <View style={styles.mentorCard}>
            <Image source={require('../../assets/Logotipo.png')} style={styles.mentorCardLogo} resizeMode="contain" />
            <Text style={styles.mentorCardText}>
              Cadastre seu Nutricionista ou Personal e{'\n'}
              melhore sua rotina com <Text style={styles.mentorCardBold}>DYNAMIS</Text>
            </Text>
            <TouchableOpacity style={styles.mentorButton} onPress={handleRegisterMentor}>
              <Text style={styles.mentorButtonText}>Cadastrar Mentor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

  
      <View style={styles.bottomNav}>
        {/* Indicador branco que desliza */}
        <Animated.View style={[styles.activeIndicator, { left: slideAnim }]} />

        {/* Camada dos botões, que fica sobre o indicador */}
        <View style={styles.navButtonContainer}>
          <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('home')}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="home" size={26} color={activeTab === 'home' ? '#000' : '#FFF'} />
              {activeTab === 'home' && <Text style={styles.navText}>Home</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('insights')}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="insights" size={26} color={activeTab === 'insights' ? '#000' : '#FFF'} />
              {activeTab === 'insights' && <Text style={styles.navText}>Metas</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('person')}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="person" size={26} color={activeTab === 'person' ? '#000' : '#FFF'} />
              {activeTab === 'person' && <Text style={styles.navText}>Perfil</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContentContainer: {
    paddingBottom: 120, // Aumentado para garantir espaço
  },
  coverSection: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingHorizontal: 20,
    
    height: 500,
    marginBottom: 36,
  },
  header: {
    marginBottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    alignSelf: 'center',
  },
  mainTextContainer: {
    marginBottom: 60,
    justifyContent: 'flex-end',
    flex: 1,
    
  },
  mainText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
    alignItems: 'flex-end',
  },
  goldText: {
    color: '#9ACD32',
  },
  mainContent: {
    height: 'auto',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  sequenceContainer: {
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
  streakNumber: {
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(162, 255, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#9ACD32',
  },
  dayButtonCompleted: {
    backgroundColor: '#9ACD32',
  },
  dayButtonIcon: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#9ACD32',
    borderRadius: 25,
    marginBottom: 30,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  mentorCard: {
    backgroundColor: '#9ACD32',
    borderRadius: 32,
    padding: 20,
  },
  mentorCardLogo: {
    width: 200,
    color: '#1C1C1E',

    alignItems: 'center',
  },
  mentorCardText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 20,
    lineHeight: 24,
  },
  mentorCardBold: {
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  mentorButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mentorButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalSubtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginBottom: 20,
    width: '100%',
    textAlign: 'left',
  },
  modalGrabber: {
    width: 40,
    height: 5,
    backgroundColor: '#444',
    borderRadius: 2.5,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    marginTop: 16,
    width: '100%',
    textAlign: 'left',

  },
  // NOVO: Container para o input com ícone
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  // MODIFICADO: Estilo do campo de texto
  inputField: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  // MODIFICADO: Container dos botões
  modalButtonContainer: {
    width: '100%',
    marginTop: 20,
  },
  // MODIFICADO: Botão de cancelar
  modalButtonCancel: {
    padding: 15,
    borderRadius: 40,
    backgroundColor: '#2C2C2E', // Cor de fundo mais escura
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // MODIFICADO: Botão de salvar (ação primária)
  modalButtonSave: {
    padding: 18,
    borderRadius: 40,
    alignItems: 'center',
    backgroundColor: '#9ACD32', // Cor de destaque do seu app
    marginBottom: 10,
  },
  modalButtonTextSave: {
    color: '#1C1C1E',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;