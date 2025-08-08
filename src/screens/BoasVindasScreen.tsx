// src/screens/PerfilScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    StatusBar
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Tipagem para a navegação
type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};
type AppStackParamList = {
    MainTabs: undefined;
    GerenciarInformacoes: undefined;
};
type AuthStackParamList = {
    BoasVindas: undefined;
};

// Use CompositeScreenProps para o PerfilScreen
type PerfilScreenProps = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'PerfilTab'>,
    NativeStackScreenProps<AppStackParamList & AuthStackParamList>
>;

// Adicione as novas interfaces para os dados do nutricionista
interface ClientMealPlan {
    [day: string]: {
        [meal: string]: string;
    };
}
interface ClientImportantNotes {
    notes: string;
}

const refeicoes: { nome: string; icone: string }[] = [
    { nome: 'Café da Manhã', icone: 'coffee-outline' },
    { nome: 'Almoço', icone: 'silverware-fork-knife' },
    { nome: 'Café da Tarde', icone: 'coffee-outline' },
    { nome: 'Jantar', icone: 'silverware-fork-knife' },
    { nome: 'Ceia', icone: 'food-apple' },
];
const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const mockBackendApi = {
    updateNotificationPreference: async (userId: string, isEnabled: boolean) => {
        try {
            if (!userId) throw new Error("User not logged in.");
            const userRef = doc(db, "usuarios", userId);
            await updateDoc(userRef, { notificationsEnabled: isEnabled });
            console.log(`Firestore: Notificações atualizadas para ${isEnabled} para o usuário ${userId}`);
            return { success: true, newStatus: isEnabled };
        } catch (error) {
            console.error("Firestore: Erro ao atualizar notificações", error);
            throw new Error("Falha ao atualizar preferência de notificação.");
        }
    },
    sendNutritionistRequest: async (userId: string) => {
        try {
            if (!userId) throw new Error("User not logged in.");
            const userRef = doc(db, "usuarios", userId);
            await updateDoc(userRef, {
                'nutricionista.requestStatus': 'sent',
                'nutricionista.lastRequestDate': new Date().toISOString()
            });
            console.log(`Firestore: Solicitação ao nutricionista enviada para o usuário ${userId}.`);
            return { success: true, status: 'sent' };
        } catch (error) {
            console.error("Firestore: Erro ao enviar solicitação ao nutricionista.", error);
            throw new Error("Falha ao enviar solicitação ao nutricionista.");
        }
    },
    logoutUser: async () => {
        try {
            await auth.signOut();
            console.log("Firebase Auth: Usuário desconectado.");
            return { success: true };
        } catch (error) {
            console.error("Firebase Auth: Erro ao fazer logout", error);
            throw new Error("Falha ao desconectar.");
        }
    }
};

const PerfilScreen: React.FC<PerfilScreenProps> = () => {
    const navigation = useNavigation<PerfilScreenProps['navigation']>();
    const { t } = useTranslation();

    const [userName, setUserName] = useState(t('profile.loading'));
    const [userEmail, setUserEmail] = useState(t('profile.loading'));
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);

    const [isSnackbarVisible, setSnackbarVisible] = useState(false);
    const snackbarAnim = useRef(new Animated.Value(100)).current;
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const [playBellAnimation, setPlayBellAnimation] = useState(false);
    const bellRotateAnim = useRef(new Animated.Value(0)).current;

    const [isShareCodeVisible, setIsShareCodeVisible] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const [nutricionistaVinculado, setNutricionistaVinculado] = useState(false); // NOVO ESTADO: se tem nutricionista

    // NOVOS ESTADOS PARA EXIBIÇÃO DO PLANO/AVISOS DO NUTRICIONISTA
    const [planoDeRefeicao, setPlanoDeRefeicao] = useState<ClientMealPlan | null>(null);
    const [avisosNutricionista, setAvisosNutricionista] = useState<string | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()); // Adicionado para carregar o plano do dia correto

    const isFocused = useIsFocused();

    const showSnackbar = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    }, []);

    const fetchShareCode = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) {
            showSnackbar(t('profile.snackbarGenerateCodeLoggedOut'), 'error');
            return;
        }
        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.codigoPartilha) {
                    setShareCode(userData.codigoPartilha);
                    setIsShareCodeVisible(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } else {
                    showSnackbar(t('profile.shareCodeNotFound'), 'error');
                }
            } else {
                showSnackbar(t('profile.userDataNotFound'), 'error');
            }
        } catch (error) {
            console.error("fetchShareCode: Erro ao buscar código de partilha:", error);
            showSnackbar(t('profile.snackbarShareCodeError'), 'error');
        }
    }, [showSnackbar, t]);

    const [currentAuthUserUid, setCurrentAuthUserUid] = useState<string | null>(null);
    const [isAuthInitializing, setIsAuthInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            const newUid = user ? user.uid : null;
            setCurrentAuthUserUid(newUid);
            if (isAuthInitializing) {
                setIsAuthInitializing(false);
            }
        });
        return () => {
            unsubscribe();
        };
    }, [currentAuthUserUid, isAuthInitializing]);

    const loadData = useCallback(async () => {
        setIsLoadingUserData(true);
        const user = auth.currentUser;
        if (!user) {
            setIsLoadingUserData(false);
            showSnackbar(t('profile.sessionExpired'), 'error');
            navigation.navigate('BoasVindas');
            return;
        }
        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setUserName(userData.nome || '');
                setUserEmail(userData.email || '');
                setNotificationsEnabled(userData.notificationsEnabled ?? true);
                setRequestStatus(userData.nutricionista?.requestStatus || 'idle');
                setPlanoDeRefeicao(userData.planosDeRefeicao || null);
                setAvisosNutricionista(userData.avisosImportantes?.notes || null);
                // NOVO: Verificar se o cliente tem nutricionista vinculado
                setNutricionistaVinculado(!!userData.nutricionistaVinculadoUID);
            } else {
                showSnackbar(t('profile.userDataNotFound'), 'error');
                navigation.navigate('BoasVindas');
            }
        } catch (error) {
            console.error("loadData: Erro ao carregar dados:", error);
            showSnackbar(t('profile.userDataLoadError'), 'error');
        } finally {
            setIsLoadingUserData(false);
        }
    }, [showSnackbar, navigation, t]);

    useEffect(() => {
        if (isFocused && auth.currentUser) {
            loadData();
        }
    }, [isFocused, loadData]);

    useEffect(() => {
        if (isSnackbarVisible) {
            Animated.timing(snackbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            const timer = setTimeout(() => {
                Animated.timing(snackbarAnim, { toValue: 100, duration: 300, useNativeDriver: true, }).start(() => setSnackbarVisible(false));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSnackbarVisible]);

    useEffect(() => {
        if (playBellAnimation) {
            Animated.sequence([
                Animated.timing(bellRotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellRotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellRotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellRotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start(() => setPlayBellAnimation(false));
        }
    }, [playBellAnimation, bellRotateAnim]);

    const toggleSwitch = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) {
            showSnackbar(t('profile.snackbarNotificationLoggedOut'), 'error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        if (newState) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPlayBellAnimation(true); }
        try {
            await mockBackendApi.updateNotificationPreference(user.uid, newState);
            showSnackbar(t('profile.snackbarNotificationSuccess'), 'success');
        } catch (error) {
            setNotificationsEnabled(!newState);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showSnackbar(t('profile.snackbarNotificationError'), 'error');
        }
    }, [notificationsEnabled, showSnackbar, t]);

    const handleSendRequest = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) {
            showSnackbar(t('profile.snackbarRequestLoggedOut'), 'error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        if (requestStatus !== 'idle') return;
        setRequestStatus('loading');
        try {
            await mockBackendApi.sendNutritionistRequest(user.uid);
            setRequestStatus('sent');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSnackbar(t('profile.snackbarRequestSuccess'), 'success');
        } catch (error) {
            setRequestStatus('idle');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showSnackbar(t('profile.snackbarRequestError'), 'error');
        }
    }, [requestStatus, showSnackbar, t]);

    const handleLogout = useCallback(async () => {
        try {
            await mockBackendApi.logoutUser();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSnackbar(t('profile.snackbarLogoutSuccess'), 'success');
            navigation.navigate('BoasVindas');
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showSnackbar(t('profile.snackbarLogoutError'), 'error');
        }
    }, [navigation, showSnackbar, t]);

    const handleManageInfo = useCallback(() => {
        navigation.navigate('GerenciarInformacoes');
    }, [navigation]);

    const renderChipContent = () => {
        switch (requestStatus) {
            case 'loading': return <ActivityIndicator size="small" color="#121212" />;
            case 'sent': return (<><MaterialCommunityIcons name="clock-outline" size={18} color="#FFFFFF" /><Text style={styles.chipButtonTextSent}>{t('profile.requestPending')}</Text></>);
            default: return (<><MaterialCommunityIcons name="check" size={18} color="#121212" /><Text style={styles.chipButtonText}>{t('profile.sendRequestButton')}</Text></>);
        }
    };

    const diaDaSemanaAtual = daysOfWeek[new Date().getDay()];
    const planoDoDia = planoDeRefeicao?.[diaDaSemanaAtual] || {};
    const hasPlanoDoDia = Object.keys(planoDoDia).length > 0;

    return (
        <View style={styles.rootContainer}>
            <LinearGradient colors={['#181917', '#020500']} style={StyleSheet.absoluteFill} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    {isLoadingUserData ? (
                        <ActivityIndicator size="large" color="#AEF359" />
                    ) : (
                        <>
                            <Text style={styles.headerName}>{userName}</Text>
                            <Text style={styles.headerEmail}>{userEmail}</Text>
                        </>
                    )}
                </View>

                {/* Modal de Código de Partilha */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isShareCodeVisible}
                    onRequestClose={() => { setIsShareCodeVisible(false); }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <View style={styles.modalIconContainer}>
                                <MaterialCommunityIcons name="account-key" size={32} color="#AEF359" />
                            </View>
                            <Text style={styles.modalTitle}>{t('profile.modalVerificationCodeTitle')}</Text>
                            <Text style={styles.modalCode}>{shareCode}</Text>
                            <TouchableOpacity
                                style={styles.modalButtonGreen}
                                onPress={() => setIsShareCodeVisible(false)}
                            >
                                <Text style={styles.modalButtonTextGreen}>{t('profile.modalBackButton')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={styles.card}>
                    <View style={styles.notificationRow}>
                        <Animated.View style={{ transform: [{ rotate: bellRotateAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) }] }}>
                            <MaterialCommunityIcons name={notificationsEnabled ? "bell" : "bell-outline"} size={24} color={notificationsEnabled ? "#AEF359" : "#E0E0E0"}/>
                        </Animated.View>
                        <View style={styles.textContainer}>
                            <Text style={styles.rowTitle}>{t('profile.notificationTitle')}</Text>
                            <Text style={styles.rowSubtitle}>{t('profile.notificationSubtitle')}</Text>
                        </View>
                        <Switch trackColor={{ false: '#767577', true: '#2E7D32' }} thumbColor={notificationsEnabled ? '#AEF359' : '#f4f3f4'} onValueChange={toggleSwitch} value={notificationsEnabled} />
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuRow} onPress={handleManageInfo}>
                        <MaterialCommunityIcons name="cog-outline" size={24} color="#E0E0E0" />
                        <View style={styles.textContainer}>
                            <Text style={styles.rowTitle}>{t('profile.manageInfoTitle')}</Text>
                            <Text style={styles.rowSubtitle}>{t('profile.manageInfoSubtitle')}</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-top-right" size={20} color="#E0E0E0" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#E0E0E0" />
                        <View style={styles.textContainer}>
                            <Text style={styles.rowTitle}>{t('profile.logoutTitle')}</Text>
                            <Text style={styles.rowSubtitle}>{t('profile.logoutSubtitle')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Seção Nutricionista */}
                <View style={styles.nutritionistSection}>
                    {/* Renderização condicional para o botão Gerar Código */}
                    {!nutricionistaVinculado ? (
                        <View style={styles.textCard}>
                            {isLoadingUserData ? (
                                <ActivityIndicator size="large" color="#AEF359" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="file-document-outline" size={48} color="#E0E0E0" />
                                    <Text style={styles.requestCardText}>{t('profile.shareCodePrompt')}</Text>
                                    <TouchableOpacity style={styles.shareButton} onPress={fetchShareCode}>
                                        <Text style={styles.shareButtonText}>{t('profile.generateCodeButton')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    ) : (
                        // Exibir plano de refeições e avisos se o cliente tiver um nutricionista
                        <>
                            <View style={styles.nutritionistContent}>
                                <Text style={styles.sectionTitle}>Plano de Refeições</Text>
                                <Text style={styles.sectionSubtitle}>Plano atual para {diaDaSemanaAtual}</Text>
                                {hasPlanoDoDia ? (
                                    refeicoes.map((ref, index) => (
                                        <View key={index} style={styles.mealItem}>
                                            <MaterialCommunityIcons name={ref.icone} size={20} color="#AEF359" />
                                            <View style={styles.mealTextContainer}>
                                                <Text style={styles.mealTitle}>{ref.nome}</Text>
                                                <Text style={styles.mealDescription}>{planoDoDia[ref.nome]}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.noPlanContainer}>
                                        <Text style={styles.noPlanText}>Nenhum plano de refeição definido para hoje.</Text>
                                    </View>
                                )}
                            </View>
                            {avisosNutricionista && (
                                <View style={styles.avisosContainer}>
                                    <View style={styles.importantHeader}>
                                        <MaterialCommunityIcons name="alert-circle" size={20} color="#AEF359" style={{ marginRight: 6 }} />
                                        <Text style={styles.importantTitle}>{t('profile.importantTitle')}</Text>
                                    </View>
                                    <Text style={styles.avisosText}>{avisosNutricionista}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {isSnackbarVisible && (
                <Animated.View style={[
                    styles.snackbarContainer,
                    { transform: [{ translateY: snackbarAnim }] },
                    snackbarType === 'error' ? styles.snackbarError : styles.snackbarSuccess
                ]}>
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#020500',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        position: 'relative',
        paddingBottom: 120,
    },
    header: {
        marginTop: 60,
        marginBottom: 30,
        zIndex: 1,
        alignItems: 'flex-start',
    },
    textCard: {
        backgroundColor: '#181917',
        width: '100%',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    headerName: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: 'bold',
    },
    headerEmail: {
        color: '#9E9E9E',
        fontSize: 24,
        marginTop: 4,
        marginBottom: 15,
    },
    shareButton: {
        backgroundColor: '#AEF359',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginTop: 10,
    },
    shareButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#181917',
        borderRadius: 32,
        padding: 10,
        marginTop: 20,
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
    nutritionistSection: {
        marginTop: 20,
        marginBottom: 40,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 7,
    },
    sectionSubtitle: {
        color: '#9E9E9E',
        fontSize: 16,
        marginTop: 4,
        marginBottom: 20,
    },
    nutritionistContent: {
        backgroundColor: '#181917',
        borderRadius: 24,
        padding: 20,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    mealTextContainer: {
        marginLeft: 10,
    },
    mealTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mealDescription: {
        color: '#9E9E9E',
        fontSize: 14,
    },
    noPlanContainer: {
        alignItems: 'center',
        padding: 20,
    },
    noPlanText: {
        color: '#9E9E9E',
        textAlign: 'center',
    },
    avisosContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#AEF359',
        padding: 20,
        marginTop: 20,
    },
    avisosText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 22,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 95,
        left: 16,
        right: 16,
        borderRadius: 8,
        padding: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        borderLeftWidth: 4,
    },
    snackbarText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
    snackbarSuccess: {
        backgroundColor: '#323232',
        borderLeftColor: '#AEF359',
    },
    snackbarError: {
        backgroundColor: '#C62828',
        borderLeftColor: '#FF6347',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#121212',
        borderRadius: 48,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        width: '85%',
    },
    modalIconContainer: {
        backgroundColor: '#243314',
        borderRadius: 92,
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        marginBottom: 40,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalCode: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'light',
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 1,
    },
    modalButtonGreen: {
        backgroundColor: '#AEF359',
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 30,
        elevation: 2,
        width: '100%',
    },
    modalButtonTextGreen: {
        color: '#000000',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
});

export default PerfilScreen;