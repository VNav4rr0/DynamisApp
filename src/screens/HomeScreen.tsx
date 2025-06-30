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
    Alert, // Adicionar Alert para feedback ao usuário
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { format, isToday, isYesterday, parseISO } from 'date-fns'; // Para lidar com datas
import { ptBR } from 'date-fns/locale'; // Para localização (opcional)

// --- Firebase Imports ---
import { auth, db } from '../../firebaseConfig/firebase'; // Verifique o caminho
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Importar doc, getDoc, setDoc, updateDoc
import { useIsFocused } from '@react-navigation/native'; // Para recarregar dados ao focar na tela

const { width } = Dimensions.get('window');

// --- Tipagem ---
export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'HomeTab'>;

// Nova interface para os dados de sequência no Firestore
interface StreakData {
    currentStreak: number;
    lastCompletionDate: string; // ISO string 'YYYY-MM-DD'
    completedDaysOfWeek: string[]; // ['Seg', 'Ter', ...] da semana atual
}

// Nova interface para os dados diários
interface DailyLog {
    calories: number;
    weight: number;
    water: number;
    timestamp: string; // Data e hora da atualização
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
    const [currentDayIndex, setCurrentDayIndex] = useState<number>(new Date().getDay()); // 0=Dom, 1=Seg
    const [currentStreak, setCurrentStreak] = useState<number>(0);
    const [completedDays, setCompletedDays] = useState<string[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [calories, setCalories] = useState('');
    const [weight, setWeight] = useState('');
    const [water, setWater] = useState('');
    const [modalSubtitle, setModalSubtitle] = useState('');
    
    const [playFireAnimation, setPlayFireAnimation] = useState(false);
    const fireAnimation = useRef(new Animated.Value(1)).current;

    // Novo estado para o carregamento da sequência
    const [isLoadingStreak, setIsLoadingStreak] = useState(true);
    const [errorLoadingStreak, setErrorLoadingStreak] = useState<string | null>(null);

    const isFocused = useIsFocused(); // Hook para verificar se a tela está focada

    const motivationalPhrases = [
        "Continue firme, cada dia conta!",
        "Você está mais perto do seu objetivo!",
        "A disciplina te leva longe!",
    ];
    
    const days = [
        { day: 'Dom', label: 'Dom' }, // Ajuste para Domingo como 0
        { day: 'Seg', label: 'Seg' },
        { day: 'Ter', label: 'Ter' },
        { day: 'Qua', label: 'Qua' },
        { day: 'Qui', label: 'Qui' },
        { day: 'Sex', label: 'Sex' },
        { day: 'Sab', label: 'Sab' },
    ];

    // --- FUNÇÕES DE INTERAÇÃO COM O BANCO DE DADOS (STREAK E DAILY LOGS) ---
    const loadStreakData = useCallback(async () => {
        setIsLoadingStreak(true);
        setErrorLoadingStreak(null);
        const user = auth.currentUser;

        if (!user) {
            console.log("Home: Usuário não logado, não carregando sequência.");
            setIsLoadingStreak(false);
            // setCompletedDays([]); // Limpar dias se não logado
            // setCurrentStreak(0); // Resetar sequência
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const streakData = userData.streakData as StreakData;

                console.log("Home: Dados de sequência puxados do Firestore:", streakData);

                if (streakData) {
                    let { currentStreak, lastCompletionDate, completedDaysOfWeek } = streakData;
                    const lastDate = parseISO(lastCompletionDate);
                    const today = new Date();

                    if (isToday(lastDate)) {
                        // Mesma data, sequência e dias completados permanecem
                        console.log("Home: Atividade já registrada hoje. Sequência atual:", currentStreak);
                    } else if (isYesterday(lastDate)) {
                        // Ontem foi o último dia, sequência continua
                        console.log("Home: Última atividade foi ontem. Sequência continua:", currentStreak);
                    } else {
                        // Perdeu a sequência, resetar
                        console.log("Home: Sequência perdida. Resetando sequência.");
                        currentStreak = 0; // Se a sequência já está em zero, manter em zero
                        // Opcional: Resetar completedDaysOfWeek apenas se a semana mudou drasticamente
                    }
                    
                    // Sempre atualizar o currentDayIndex para o dia de hoje
                    setCurrentDayIndex(today.getDay()); 
                    setCompletedDays(completedDaysOfWeek || []); // Garante que seja um array
                    setCurrentStreak(currentStreak);
                    setPlayFireAnimation(true); // Anima o fogo na carga (opcional)

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
    }, []);

    const saveStreakAndDailyLogData = useCallback(async (
        newStreak: number, 
        newCompletedDays: string[], 
        newCurrentDayIndex: number,
        dailyLogData: DailyLog // Novo parâmetro para os dados diários
    ) => {
        const user = auth.currentUser;
        if (!user) {
            console.error("Home: Usuário não logado, não pode salvar sequência ou dados diários.");
            Alert.alert("Erro", "Você precisa estar logado para salvar seu progresso.");
            return;
        }

        const todayDateISO = format(new Date(), 'yyyy-MM-dd'); // Formato ISO para a data

        const updatedStreakData: StreakData = {
            currentStreak: newStreak,
            lastCompletionDate: todayDateISO,
            completedDaysOfWeek: newCompletedDays,
        };

        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            await updateDoc(userDocRef, { 
                streakData: updatedStreakData,
                [`dailyLogs.${todayDateISO}`]: dailyLogData // Salva os dados diários no mapa dailyLogs
            });
            console.log("Home: Sequência e dados diários salvos com sucesso no Firestore:", updatedStreakData, dailyLogData);
        } catch (error) {
            console.error("Home: Erro ao salvar dados de sequência ou diários:", error);
            Alert.alert("Erro", "Não foi possível salvar seu progresso. Tente novamente.");
        }
    }, []);


    // --- EFEITOS ---
    useEffect(() => {
        // Quando a tela está focada, tenta carregar os dados de sequência
        if (isFocused) {
            loadStreakData();
        }
    }, [isFocused, loadStreakData]); // Recarrega sempre que a tela foca

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
        const todayName = days[new Date().getDay()].day; // Pega o nome do dia de hoje (ex: 'Seg')
        const todayDateISO = format(new Date(), 'yyyy-MM-dd'); // Data atual para a chave do dailyLog

        let newStreak = currentStreak;
        let newCompletedDays = [...completedDays];

        const user = auth.currentUser;
        if (!user) {
            console.error("Home: Usuário não logado ao tentar salvar dados. Operação abortada.");
            Alert.alert("Erro", "Você precisa estar logado para salvar seu progresso.");
            handleCloseModal();
            return;
        }

        // Validação dos inputs
        const parsedCalories = parseFloat(calories);
        const parsedWeight = parseFloat(weight);
        const parsedWater = parseFloat(water);

        if (isNaN(parsedCalories) || isNaN(parsedWeight) || isNaN(parsedWater)) {
            Alert.alert("Erro", "Por favor, insira valores numéricos válidos para Calorias, Peso e Água.");
            return;
        }

        // Carrega os dados mais recentes do Firestore antes de atualizar
        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let latestStreakData: StreakData | null = null;
            if (userDocSnap.exists() && userDocSnap.data().streakData) {
                latestStreakData = userDocSnap.data().streakData as StreakData;
            }

            const lastDateISO = latestStreakData?.lastCompletionDate;
            const lastDate = lastDateISO ? parseISO(lastDateISO) : null;
            const today = new Date();

            if (lastDate && isToday(lastDate)) {
                // Já completou hoje
                console.log("Home: Meta diária já completada para hoje. Apenas atualizando dados diários.");
                // Não altera a streak, apenas os dados diários
            } else if (lastDate && isYesterday(lastDate)) {
                // Completou ontem, continua a sequência
                newStreak += 1;
                console.log("Home: Sequência continuada. Nova sequência:", newStreak);
            } else {
                // Sequência perdida ou primeiro dia
                newStreak = 1; // Começa nova sequência
                // A cada nova sequência/dia, resetamos os dias da semana completados
                newCompletedDays = []; 
                console.log("Home: Nova sequência iniciada/resetada:", newStreak);
            }

            // Adiciona o dia da semana atual aos dias completados se ainda não estiver lá
            if (!newCompletedDays.includes(todayName)) {
                newCompletedDays.push(todayName);
            }

            // Prepara os dados diários para salvar
            const dailyLogData: DailyLog = {
                calories: parsedCalories,
                weight: parsedWeight,
                water: parsedWater,
                timestamp: new Date().toISOString(), // Salva a data e hora exata da submissão
            };

            // Atualiza os estados locais
            setCurrentStreak(newStreak);
            setCompletedDays(newCompletedDays);
            setCurrentDayIndex(today.getDay()); // Garante que o dia ativo é o de hoje

            setPlayFireAnimation(true); // Anima o fogo
            
            // Salva os dados no Firestore
            await saveStreakAndDailyLogData(newStreak, newCompletedDays, today.getDay(), dailyLogData);

            Alert.alert("Sucesso", "Seu progresso foi salvo!");

        } catch (error) {
            console.error("Home: Erro ao processar ou salvar dados diários:", error);
            Alert.alert("Erro", "Não foi possível salvar seu progresso. Tente novamente.");
        } finally {
            handleCloseModal(); // Fechar modal independentemente do sucesso/falha
        }
    };

    // Ajuste nas chamadas de navegação para os nomes das abas no BottomTabNavigator
    const navigateToInsights = () => {
        navigation.navigate('ProgressoDetalhadoTab');
    };
    const navigateToProfile = () => {
        navigation.navigate('PerfilTab');
    };

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
                                    onPress={() => {}} // Sem ação de clique para os dias individuais, apenas visual
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
    errorTextSmall: { // Novo estilo para erros menores
        color: '#C62828',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
});

export default HomeScreen;