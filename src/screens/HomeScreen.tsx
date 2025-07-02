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
    ActivityIndicator,
    Alert, // Removendo o import de Alert, pois vamos usar CustomAlertModal
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { format, isToday, isYesterday, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Firebase Imports ---
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';


// Certifique-se de que o caminho abaixo está correto e aponta para o seu componente personalizado
import CustomAlertModal from '../components/CustomAlertModal'; // Importando o CustomAlertModal
// Ajuste o caminho acima conforme a localização real do seu CustomAlertModal.tsx

const { width } = Dimensions.get('window');

// --- Tipagem ---
export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'HomeTab'>;

interface StreakData {
    currentStreak: number;
    lastCompletionDate: string;
    completedDaysOfWeek: string[];
}

interface DailyLog {
    calories: number;
    weight: number;
    water: number;
    timestamp: string;
}

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

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    // Estados
    const [currentDayIndex, setCurrentDayIndex] = useState<number>(new Date().getDay());
    const [currentStreak, setCurrentStreak] = useState<number>(0);
    const [completedDays, setCompletedDays] = useState<string[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [calories, setCalories] = useState('');
    const [weight, setWeight] = useState('');
    const [water, setWater] = useState('');
    const [modalSubtitle, setModalSubtitle] = useState('');
    
    const [playFireAnimation, setPlayFireAnimation] = useState(false);
    const fireAnimation = useRef(new Animated.Value(1)).current;

    const [isLoadingStreak, setIsLoadingStreak] = useState(true);
    const [errorLoadingStreak, setErrorLoadingStreak] = useState<string | null>(null);

    // --- NOVOS ESTADOS PARA CUSTOM ALERT MODAL ---
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const isFocused = useIsFocused();

    const motivationalPhrases = [
        "Continue firme, cada dia conta!",
        "Você está mais perto do seu objetivo!",
        "A disciplina te leva longe!",
    ];

    // --- FUNÇÕES DO CUSTOM ALERT MODAL ---
    const showAlert = useCallback((title: string, message: string) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setIsAlertVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setIsAlertVisible(false);
    }, []);

    // --- FUNÇÕES DE INTERAÇÃO COM O BANCO DE DADOS (STREAK E DAILY LOGS) ---
    const loadStreakData = useCallback(async () => {
        setIsLoadingStreak(true);
        setErrorLoadingStreak(null);
        const user = auth.currentUser;

        if (!user) {
            console.log("Home: Usuário não logado, não carregando sequência.");
            setIsLoadingStreak(false);
            setCompletedDays([]);
            setCurrentStreak(0);
            setCurrentDayIndex(new Date().getDay());
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const streakData = userData.streakData as StreakData;
                const today = new Date();
                const currentDayName = days[today.getDay()].day;

                console.log("Home: Dados de sequência puxados do Firestore:", streakData);

                if (streakData) {
                    let { currentStreak: storedStreak, lastCompletionDate, completedDaysOfWeek } = streakData;
                    const lastDate = parseISO(lastCompletionDate);

                    let newStreak = storedStreak;
                    let newCompletedDaysOfWeek = completedDaysOfWeek || [];
                    
                    const startOfLastWeek = startOfWeek(lastDate, { locale: ptBR, weekStartsOn: 0 });
                    const startOfThisWeek = startOfWeek(today, { locale: ptBR, weekStartsOn: 0 });

                    if (!isSameDay(startOfLastWeek, startOfThisWeek)) {
                        console.log("Home: Nova semana detectada. Resetando dias da semana completados.");
                        newCompletedDaysOfWeek = [];
                    }

                    if (isToday(lastDate)) {
                        console.log("Home: Atividade já registrada hoje. Sequência atual:", newStreak);
                    } else if (isYesterday(lastDate)) {
                        console.log("Home: Última atividade foi ontem. Sequência continua:", newStreak);
                        newStreak += 1;
                    } else {
                        console.log("Home: Sequência perdida. Resetando sequência.");
                        newStreak = 0;
                        newCompletedDaysOfWeek = [];
                    }

                    if (isToday(lastDate) && !newCompletedDaysOfWeek.includes(currentDayName)) {
                         newCompletedDaysOfWeek.push(currentDayName);
                    } else if (!isToday(lastDate) && newCompletedDaysOfWeek.includes(currentDayName)) {
                        newCompletedDaysOfWeek = newCompletedDaysOfWeek.filter(day => day !== currentDayName);
                    }

                    setCurrentStreak(newStreak);
                    setCompletedDays(newCompletedDaysOfWeek);
                    setCurrentDayIndex(today.getDay());
                    setPlayFireAnimation(true);
                    
                } else {
                    console.log("Home: streakData não encontrado no Firestore. Iniciando sequência em 0.");
                    setCurrentStreak(0);
                    setCompletedDays([]);
                    setCurrentDayIndex(new Date().getDay());
                }
            } else {
                console.log("Home: Documento do usuário não encontrado. Iniciando sequência em 0.");
                setCurrentStreak(0);
                setCompletedDays([]);
                setCurrentDayIndex(new Date().getDay());
            }
        } catch (error) {
            console.error("Home: Erro ao carregar dados de sequência:", error);
            setErrorLoadingStreak("Erro ao carregar sua sequência. Tente novamente.");
            setCurrentStreak(0);
            setCompletedDays([]);
        } finally {
            setIsLoadingStreak(false);
            console.log("Home: Carregamento de sequência finalizado.");
        }
    }, [showAlert]); // Adicionado showAlert como dependência

    const saveStreakAndDailyLogData = useCallback(async (
        newStreak: number, 
        newCompletedDays: string[], 
        dailyLogData: DailyLog
    ) => {
        const user = auth.currentUser;
        if (!user) {
            console.error("Home: Usuário não logado, não pode salvar sequência ou dados diários.");
            showAlert("Erro", "Você precisa estar logado para salvar seu progresso."); // Usando showAlert
            return;
        }

        const todayDateISO = format(new Date(), 'yyyy-MM-dd');

        const updatedStreakData: StreakData = {
            currentStreak: newStreak,
            lastCompletionDate: todayDateISO,
            completedDaysOfWeek: newCompletedDays,
        };

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            await updateDoc(userDocRef, { 
                streakData: updatedStreakData,
                [`dailyLogs.${todayDateISO}`]: dailyLogData
            });
            console.log("Home: Sequência e dados diários salvos com sucesso no Firestore:", updatedStreakData, dailyLogData);
            showAlert("Sucesso", "Seu progresso foi salvo!"); // Usando showAlert para sucesso
        } catch (error) {
            console.error("Home: Erro ao salvar dados de sequência ou diários:", error);
            showAlert("Erro", "Não foi possível salvar seu progresso. Tente novamente."); // Usando showAlert para erro
        }
    }, [showAlert]);


    // --- EFEITOS ---
    useEffect(() => {
        if (isFocused) {
            loadStreakData();
        }
    }, [isFocused, loadStreakData]);

    useEffect(() => {
        if (playFireAnimation) {
            Animated.sequence([
                Animated.timing(fireAnimation, { toValue: 1.6, duration: 300, useNativeDriver: true }),
                Animated.timing(fireAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start(() => setPlayFireAnimation(false));
        }
    }, [playFireAnimation, fireAnimation]);

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---
    const openModal = () => {
        const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
        setModalSubtitle(motivationalPhrases[randomIndex]);
        setModalVisible(true);
    };
    
    const handleCloseModal = () => {
        setModalVisible(false);
        setCalories(''); setWeight(''); setWater('');
    };
    
    const handleSaveData = async () => {
        const today = new Date();
        const todayName = days[today.getDay()].day;
        const todayDateISO = format(today, 'yyyy-MM-dd');

        let newStreak = currentStreak;
        let newCompletedDays = [...completedDays];

        const user = auth.currentUser;
        if (!user) {
            console.error("Home: Usuário não logado ao tentar salvar dados. Operação abortada.");
            showAlert("Erro", "Você precisa estar logado para salvar seu progresso."); // Usando showAlert
            handleCloseModal();
            return;
        }

        // Validação dos inputs - AGORA USANDO showAlert
        const parsedCalories = parseFloat(calories);
        const parsedWeight = parseFloat(weight);
        const parsedWater = parseFloat(water);

        if (isNaN(parsedCalories) || isNaN(parsedWeight) || isNaN(parsedWater)) {
            showAlert("Erro de Validação", "Por favor, insira valores numéricos válidos para Calorias, Peso e Água."); // Usando showAlert
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let latestStreakData: StreakData | null = null;
            if (userDocSnap.exists() && userDocSnap.data().streakData) {
                latestStreakData = userDocSnap.data().streakData as StreakData;
            }

            const lastDateISO = latestStreakData?.lastCompletionDate;
            const lastDate = lastDateISO ? parseISO(lastDateISO) : null;
            
            if (lastDate && isToday(lastDate)) {
                console.log("Home: Meta diária já completada para hoje. Apenas atualizando dados diários.");
            } else if (lastDate && isYesterday(lastDate)) {
                newStreak += 1;
                console.log("Home: Sequência continuada. Nova sequência:", newStreak);
            } else {
                newStreak = 1;
                newCompletedDays = []; 
                console.log("Home: Nova sequência iniciada/resetada:", newStreak);
            }

            if (!newCompletedDays.includes(todayName)) {
                newCompletedDays.push(todayName);
            }

            const dailyLogData: DailyLog = {
                calories: parsedCalories,
                weight: parsedWeight,
                water: parsedWater,
                timestamp: today.toISOString(),
            };
            
            setCurrentStreak(newStreak);
            setCompletedDays(newCompletedDays);
            setCurrentDayIndex(today.getDay());

            setPlayFireAnimation(true);
            
            await saveStreakAndDailyLogData(newStreak, newCompletedDays, dailyLogData);

        } catch (error) {
            console.error("Home: Erro ao processar ou salvar dados diários:", error);
            showAlert("Erro ao Salvar", "Não foi possível salvar seu progresso. Tente novamente."); // Usando showAlert
        } finally {
            handleCloseModal();
        }
    };

    const navigateToInsights = () => {
        navigation.navigate('ProgressoDetalhadoTab');
    };
    const navigateToProfile = () => {
        navigation.navigate('PerfilTab');
    };

    const days = [
        { day: 'Dom', label: 'Dom' },
        { day: 'Seg', label: 'Seg' },
        { day: 'Ter', label: 'Ter' },
        { day: 'Qua', label: 'Qua' },
        { day: 'Qui', label: 'Qui' },
        { day: 'Sex', label: 'Sex' },
        { day: 'Sab', label: 'Sab' },
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
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Calorias consumidas (kcal)" 
                                    placeholderTextColor="#888" 
                                    keyboardType="numeric" 
                                    value={calories} 
                                    onChangeText={setCalories} 
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="scale-bathroom" size={22} color="#888" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Seu peso de hoje (kg)" 
                                    placeholderTextColor="#888" 
                                    keyboardType="decimal-pad" 
                                    value={weight} 
                                    onChangeText={setWeight} 
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="water-drop" size={22} color="#888" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Água ingerida (L)" 
                                    placeholderTextColor="#888" 
                                    keyboardType="decimal-pad" 
                                    value={water} 
                                    onChangeText={setWater} 
                                />
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
                            {isLoadingStreak ? (
                                <ActivityIndicator size="small" color="#FFA726" />
                            ) : errorLoadingStreak ? (
                                <Text style={styles.errorTextSmall}>{errorLoadingStreak}</Text>
                            ) : (
                                <View style={styles.streakContainer}>
                                    <Text style={styles.streakText}>+320 kcal</Text> {/* Valor fixo, pode vir do DB depois */}
                                    <Animated.View style={{ transform: [{ scale: fireAnimation }] }}>
                                        <MaterialCommunityIcons name="fire" size={20} color="#FFA726" />
                                    </Animated.View>
                                    <Text style={styles.streakNumber}>{currentStreak}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.daysContainer}>
                            {days.map((dayItem, index) => (
                                <DayButton 
                                    key={dayItem.day} 
                                    {...dayItem} 
                                    isActive={index === currentDayIndex} 
                                    isCompleted={completedDays.includes(dayItem.day)} 
                                    onPress={() => {}}
                                />
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
                    
                    <TouchableOpacity style={styles.secondaryCard} onPress={navigateToInsights}>
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

            {/* Renderiza o CustomAlertModal aqui */}
            <CustomAlertModal
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                onClose={hideAlert}
                type={'error'} // Sempre 'error' para este cenário de validação
            />
        </View>
    );
};

// Estilos Completos para a Tela
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
    errorTextSmall: {
        color: '#C62828',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
});

export default HomeScreen;