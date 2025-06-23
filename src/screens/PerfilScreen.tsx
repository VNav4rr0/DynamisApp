import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Switch,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

// Tipagem para a navegação
type RootTabParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  Perfil: undefined;
};

type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'Perfil'>;


const ProfileScreenFinal: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  
  // --- ESTADOS PARA O SNACKBAR ---
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const snackbarAnim = useRef(new Animated.Value(100)).current;

  // --- ESTADOS PARA A NAVBAR ---
  const navButtonWidth = (width - 40) / 3;
  const slideAnim = useRef(new Animated.Value(navButtonWidth * 2)).current;
  const [activeTab, setActiveTab] = useState<string>('person');

  // --- ESTADOS PARA A ANIMAÇÃO DO SINO ---
  const [playBellAnimation, setPlayBellAnimation] = useState(false);
  const bellRotateAnim = useRef(new Animated.Value(0)).current;


  // Efeito para o Snackbar
  useEffect(() => {
    if (isSnackbarVisible) {
      Animated.timing(snackbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(snackbarAnim, { toValue: 100, duration: 300, useNativeDriver: true, }).start(() => setSnackbarVisible(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSnackbarVisible]);

  // Efeito para a Navbar
  useEffect(() => {
    let toValue = navButtonWidth * 2; // Posição padrão é 'person'

    if (activeTab === 'home') {
      navigation.navigate('Home');
    } else if (activeTab === 'insights') {
      navigation.navigate('ProgressoDetalhado');
    }
    
    if (activeTab === 'home') toValue = 0;
    else if (activeTab === 'insights') toValue = navButtonWidth;
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      bounciness: 10,
    }).start();

  }, [activeTab]);

  // Efeito para a animação do sino
  useEffect(() => {
    if (playBellAnimation) {
      Animated.sequence([
        Animated.timing(bellRotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => setPlayBellAnimation(false));
    }
  }, [playBellAnimation]);


  const toggleSwitch = () => {
    if (!notificationsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPlayBellAnimation(true); // Dispara a animação do sino
    }
    setNotificationsEnabled(previousState => !previousState);
  };

  const handleSendRequest = () => {
    if (requestStatus !== 'idle') return;
    setRequestStatus('loading');
    
    setTimeout(() => {
      setRequestStatus('sent');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSnackbarVisible(true);
    }, 2000);
  };

  const renderChipContent = () => {
    switch (requestStatus) {
      case 'loading':
        return <ActivityIndicator size="small" color="#121212" />;
      case 'sent':
        return (
          <>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#FFFFFF" />
            <Text style={styles.chipButtonTextSent}>Solicitação Pendente</Text>
          </>
        );
      default:
        return (
          <>
            <MaterialCommunityIcons name="check" size={18} color="#121212" />
            <Text style={styles.chipButtonText}>Enviar Solicitação</Text>
          </>
        );
    }
  };


  return (
    <View style={styles.rootContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho com Nome e E-mail */}
        <View style={styles.header}>
            <Text style={styles.headerName}>Victor Taveira</Text>
            <Text style={styles.headerEmail}>vn120107@gmail.com</Text>
        </View>

        {/* Opções da Conta */}
        <View style={styles.card}>
            <View style={styles.notificationRow}>
              <Animated.View style={{ 
                transform: [{ 
                  rotate: bellRotateAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-15deg', '15deg']
                  })
                }] 
              }}>
                <MaterialCommunityIcons 
                    name={notificationsEnabled ? "bell" : "bell-outline"} 
                    size={24} 
                    color={notificationsEnabled ? "#AEF359" : "#E0E0E0"} 
                />
              </Animated.View>
              <View style={styles.textContainer}>
                  <Text style={styles.rowTitle}>Notificação</Text>
                  <Text style={styles.rowSubtitle}>Lembrete para não perder sequência</Text>
              </View>
              <Switch
                  trackColor={{ false: '#767577', true: '#2E7D32' }}
                  thumbColor={notificationsEnabled ? '#AEF359' : '#f4f3f4'}
                  onValueChange={toggleSwitch}
                  value={notificationsEnabled}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuRow}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#E0E0E0" />
              <View style={styles.textContainer}>
                  <Text style={styles.rowTitle}>Gerenciar Informações</Text>
                  <Text style={styles.rowSubtitle}>Atualize seu dados pessoais</Text>
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={20} color="#E0E0E0" />
            </TouchableOpacity>
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
        
        {/* Seção Nutricionista */}
        <View style={styles.nutritionistSection}>
            <Text style={styles.sectionTitle}>Meu Nutricionista</Text>
            <Text style={styles.sectionSubtitle}>Deixe seu Dynamis mais eficaz adicionando seu nutricionista</Text>

            <View style={styles.requestCard}>
  <MaterialCommunityIcons name="file-document-outline" size={48} color="#E0E0E0" />
  <Text style={styles.requestCardText}>Envie solicitação para o nutricionista</Text>
  
  <TouchableOpacity 
    style={[
      styles.chipButton,
      requestStatus === 'sent' && styles.chipButtonSent
    ]}
    onPress={handleSendRequest}
    disabled={requestStatus !== 'idle'}
  >
    {renderChipContent()}
  </TouchableOpacity>

  {/* Botão "Entrar Nutri" */}
 <TouchableOpacity
  style={[styles.chipButton, { marginTop: 12 }]}
  onPress={() => navigation.navigate('Nutricionista')}
>
  <Text style={styles.chipButtonText}>Entrar Nutri</Text>
</TouchableOpacity>

</View>
        </View>
      </ScrollView>

      {/* Snackbar Condicional */}
      {isSnackbarVisible && (
        <Animated.View style={[styles.snackbarContainer, { transform: [{ translateY: snackbarAnim }] }]}>
            <Text style={styles.snackbarText}>Sua solicitação foi enviada com sucesso!</Text>
        </Animated.View>
      )}

      {/* --- NAVBAR ADICIONADA --- */}
      <View style={styles.bottomNav}>
        <Animated.View style={[styles.activeIndicator, { left: slideAnim }]} />
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
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: { 
    paddingBottom: 120,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
  },
  headerEmail: {
    color: '#9E9E9E',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0C0C0C',
    borderRadius: 32,
    padding: 10,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#424242',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  logoutButton: {
    backgroundColor: '#C62828',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionistSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#9E9E9E',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  requestCard: {
    backgroundColor: '#0C0C0C',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
  },
  requestCardText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  chipButton: {
    flexDirection: 'row',
    backgroundColor: '#AEF359',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    minHeight: 48,
  },
  chipButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chipButtonSent: {
    backgroundColor: '#333333',
  },
  chipButtonTextSent: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  snackbarContainer: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: '#323232',
    borderRadius: 8,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    borderLeftColor: '#AEF359',
    borderLeftWidth: 4,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
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

export default ProfileScreenFinal;
