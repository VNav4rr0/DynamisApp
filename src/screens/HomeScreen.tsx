import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Animated,
    StatusBar,
    Modal,
    TextInput,
    Image,
    ImageBackground,
    TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'; // Importar para tipagem de props

const { width } = Dimensions.get('window');

// --- Tipagem ---
// Use a mesma MainTabParamList definida no seu App.tsx
export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

// Ajuste a tipagem do componente para corresponder ao BottomTabNavigator
type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'HomeTab'>;


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
            isActive && styles.dayButtonActive,
            isCompleted && styles.dayButtonCompleted
        ]}>
            <MaterialCommunityIcons
                name="fire"
                size={20}
                color={isCompleted ? '#121212' : '#FFF'}
                style={[styles.dayButtonIcon, isActive && styles.dayButtonIconActive]}
            />
        </View>
        <Text style={[styles.dayButtonLabel, isCompleted && styles.dayButtonLabelCompleted]}>
            {label}
        </Text>
    </TouchableOpacity>
);


// --- Componente Principal ---

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => { // Recebe navigation via props
    // Estados
    const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
    const [currentStreak, setCurrentStreak] = useState<number>(1);
    const [completedDays, setCompletedDays] = useState<string[]>(['Seg']);
    const [isModalVisible, setModalVisible] = useState(false);
    const [calories, setCalories] = useState('');
    const [weight, setWeight] = useState('');
    const [water, setWater] = useState('');
    const [modalSubtitle, setModalSubtitle] = useState('');
    // REMOVIDO: activeTab, slideAnim, navButtonWidth (gerenciados pelo CustomTabBar)
    // const [activeTab, setActiveTab] = useState<string>('home');
    // const navButtonWidth = (width - 40) / 3;
    // const slideAnim = useRef(new Animated.Value(0)).current;

    const [playFireAnimation, setPlayFireAnimation] = useState(false);

    // Animações
    const fireAnimation = useRef(new Animated.Value(1)).current;
    
    // REMOVIDO: useEffect para activeTab (gerenciado pelo CustomTabBar)
    /*
    useEffect(() => {
        let toValue = 0;
        if (activeTab === 'insights') toValue = navButtonWidth;
        else if (activeTab === 'person') toValue = navButtonWidth * 2;
        Animated.spring(slideAnim, { toValue, useNativeDriver: false, bounciness: 10 }).start();
    }, [activeTab, navButtonWidth]);
    */

    useEffect(() => {
        if (playFireAnimation) {
            Animated.sequence([
                Animated.timing(fireAnimation, { toValue: 1.6, duration: 300, useNativeDriver: true }),
                Animated.timing(fireAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start(() => setPlayFireAnimation(false));
        }
    }, [playFireAnimation, fireAnimation]); // Adicionado fireAnimation como dependência

    // Funções
    const openModal = () => {
        const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
        setModalSubtitle(motivationalPhrases[randomIndex]);
        setModalVisible(true);
    };
    
    const handleCloseModal = () => {
        setModalVisible(false);
        setCalories(''); setWeight(''); setWater('');
    };
    
    const handleSaveData = () => {
        const currentDay = days[currentDayIndex % 7].day;
        if (!completedDays.includes(currentDay)) {
            setCompletedDays(prev => [...prev, currentDay]);
            setCurrentStreak(prev => prev + 1);
            setPlayFireAnimation(true);
        }
        setCurrentDayIndex(prev => (prev + 1) % 7);
        handleCloseModal();
    };

    // Ajuste nas chamadas de navegação para os nomes das abas no BottomTabNavigator
    const navigateToInsights = () => {
        // setActiveTab('insights'); // REMOVIDO: não mais necessário
        navigation.navigate('ProgressoDetalhadoTab'); // NAVEGA PARA A ABA CORRETA
    };
    const navigateToProfile = () => {
        // setActiveTab('person'); // REMOVIDO: não mais necessário
        navigation.navigate('PerfilTab'); // NAVEGA PARA A ABA CORRETA
    };

    const motivationalPhrases = [
        "Continue firme, cada dia conta!",
        "Você está mais perto do seu objetivo!",
        "A disciplina te leva longe!",
    ];
    
    const days = [
        { day: 'Seg', label: 'Seg' }, { day: 'Ter', label: 'Ter' },
        { day: 'Qua', label: 'Qua' }, { day: 'Qui', label: 'Qui' },
        { day: 'Sex', label: 'Sex' }, { day: 'Sab', label: 'Sab' },
        { day: 'Dom', label: 'Dom' },
    ];

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" />
            
            <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={handleCloseModal}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={handleCloseModal}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.modalGrabber} />
                            <Text style={styles.modalTitle}>Atualize seu Progresso</Text>
                            <Text style={styles.modalSubtitle}>{modalSubtitle}</Text>
                            
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

                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <ImageBackground 
                    source={require('../../assets/mulher.png')} 
                    style={styles.coverSection}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', '#000']}
                        style={styles.imageOverlay}
                    />
                    <View style={styles.header}>
                        <Image source={require('../../assets/Logotipo.png')} style={styles.logo} resizeMode="contain" />
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={styles.mainText}>
                            Cada passo te aproxima
                        </Text>
                        <Text style={[styles.mainText, styles.highlightText]}>
                            do seu objetivo!
                        </Text>
                    </View>
                </ImageBackground>

                <View style={styles.contentAfterHero}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Sua Sequência</Text>
                            <View style={styles.streakContainer}>
                                <Text style={styles.streakText}>+320 kcal</Text>
                                <Animated.View style={{ transform: [{ scale: fireAnimation }] }}>
                                    <MaterialCommunityIcons name="fire" size={20} color="#FFA726" />
                                </Animated.View>
                                <Text style={styles.streakNumber}>{currentStreak}</Text>
                            </View>
                        </View>
                        <View style={styles.daysContainer}>
                            {days.map((dayItem, index) => (
                                <DayButton key={dayItem.day} {...dayItem} isActive={index === currentDayIndex} isCompleted={completedDays.includes(dayItem.day)} onPress={() => {}}/>
                            ))}
                        </View>
                    </View>
                    
                    <TouchableOpacity onPress={openModal}>
                        <LinearGradient
                            colors={['#AEF359', '#9ACD32']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryButton}
                        >
                            <MaterialCommunityIcons name="check-circle-outline" size={24} color="#121212" />
                            <Text style={styles.primaryButtonText}>Confirmar Meta Diária</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.secondaryCard} onPress={navigateToInsights}> {/* Adicionei onPress */}
                        <View style={styles.secondaryCardIconContainer}>
                            <MaterialIcons name="workspace-premium" size={28} color="#9ACD32" />
                        </View>
                        <View style={styles.secondaryCardTextContainer}>
                            <Text style={styles.secondaryCardTitle}>Acompanhamento Profissional</Text>
                            <Text style={styles.secondaryCardSubtitle}>Vincule seu mentor para potencializar seus resultados.</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={28} color="#555" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* REMOVIDO: A navbar inferior não é mais renderizada aqui */}
            {/*
            <View style={styles.bottomNav}>
                <Animated.View style={[styles.activeIndicator, { left: slideAnim }]} />
                <View style={styles.navButtonContainer}>
                    <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('home')}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="home" size={26} color={activeTab === 'home' ? '#000' : '#FFF'} />
                            {activeTab === 'home' && <Text style={styles.navText}>Home</Text>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={navigateToInsights}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="insights" size={26} color={activeTab === 'insights' ? '#000' : '#FFF'} />
                            {activeTab === 'insights' && <Text style={styles.navText}>Metas</Text>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={navigateToProfile}>
                        <View style={styles.navButtonContent}>
                            <MaterialIcons name="person" size={26} color={activeTab === 'person' ? '#000' : '#FFF'} />
                            {activeTab === 'person' && <Text style={styles.navText}>Perfil</Text>}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            */}
        </View>
    );
};

// Estilos Completos para a Tela (REMOVIDO ESTILOS DA NAVBAR)
const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContentContainer: {
        paddingBottom: 120, // Manter o padding para a área onde a navbar estará (vinda de App.tsx)
    },
    coverSection: {
        width: '100%',
        height: 500,
        justifyContent: 'space-between',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        marginTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 40,
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mainText: {
        fontSize: 38,
        fontWeight: '300',
        color: '#E0E0E0',
        lineHeight: 46,
    },
    highlightText: {
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    contentAfterHero: {
        backgroundColor: '#000',
        paddingTop: 24,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        marginHorizontal: 20,
        padding: 20,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 167, 38, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 6,
    },
    streakText: {
        fontSize: 14,
        color: '#FFA726',
        fontWeight: '600',
    },
    streakNumber: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dayButton: {
        alignItems: 'center',
        gap: 12,
    },
    dayButtonContent: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: 'rgba(174, 243, 89, 0.2)',
        borderColor: '#AEF359',
        borderWidth: 2,
    },
    dayButtonCompleted: {
        backgroundColor: '#AEF359',
    },
    dayButtonIcon: {
        opacity: 0.6,
    },
    dayButtonIconActive: {
        opacity: 1,
    },
    dayButtonLabel: {
        fontSize: 14,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    dayButtonLabelCompleted: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        marginHorizontal: 20,
        borderRadius: 32,
        marginBottom: 24,
        gap: 12,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#121212',
    },
    secondaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 20,
    },
    secondaryCardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 32,
        backgroundColor: 'rgba(174, 243, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    secondaryCardTextContainer: {
        flex: 1,
    },
    secondaryCardTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryCardSubtitle: {
        color: '#9E9E9E',
        fontSize: 14,
        marginTop: 4,
    },
    // REMOVIDOS TODOS OS ESTILOS DA NAVBAR DAQUI:
    // bottomNav, activeIndicator, navButtonContainer, navButton, navButtonContent, navText
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 20,
        paddingTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalGrabber: {
        width: 40,
        height: 5,
        backgroundColor: '#444',
        borderRadius: 2.5,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
        width: '100%',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#AAA',
        marginBottom: 30,
        width: '100%',
    },
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
    inputField: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#FFFFFF',
    },
    modalButtonContainer: {
        width: '100%',
        marginTop: 20,
    },
    modalButtonCancel: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonTextCancel: {
        color: '#888',
        fontWeight: '600',
        fontSize: 16,
    },
    modalButtonSave: {
        padding: 18,
        borderRadius: 32,
        alignItems: 'center',
        backgroundColor: '#9ACD32',
        marginBottom: 10,
    },
    modalButtonTextSave: {
        color: '#1C1C1E',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default HomeScreen;