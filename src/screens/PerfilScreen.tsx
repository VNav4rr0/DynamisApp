// ProfileScreenFinal.tsx
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
    Modal
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next'; // Importar useTranslation

const { width } = Dimensions.get('window');

// Tipagem para a navegação
type RootTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
    BoasVindasScreen: undefined;
    ManageInfoScreen: undefined; // Adicione a tipagem para a nova tela aqui
    GerenciarInformacoes: undefined; // Certifique-se de que esta rota está definida no seu navegador
    // ... outras rotas que seu StackNavigator possa ter
};

type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'PerfilTab'>;

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


const ProfileScreenFinal: React.FC<ProfileScreenProps> = () => {
    const navigation = useNavigation();
    const { t } = useTranslation(); // Use o hook useTranslation

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

    const isFocused = useIsFocused();

    const showSnackbar = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    }, []);

    const fetchShareCode = useCallback(async () => {
        const user = auth.currentUser;
        console.log("fetchShareCode: Iniciando busca do código de partilha.");

        if (!user) {
            showSnackbar(t('profile.snackbarGenerateCodeLoggedOut'), 'error');
            console.error("fetchShareCode: Usuário não logado.");
            return;
        }

        console.log("fetchShareCode: UID do usuário logado:", user.uid);

        try {
            const userDocRef = doc(db as any, "usuarios", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log("fetchShareCode: Dados do usuário encontrados para código:", userData);

                if (userData.codigoPartilha) {
                    console.log("fetchShareCode: Código de partilha encontrado:", userData.codigoPartilha);
                    setShareCode(userData.codigoPartilha);
                    setIsShareCodeVisible(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } else {
                    // Esta mensagem não estava no pt.json, adicionei
                    showSnackbar(t('profile.shareCodeNotFound'), 'error'); // Use tradução
                    console.error("fetchShareCode: O campo 'codigoPartilha' não existe ou está vazio no documento do usuário.", user.uid);
                }
            } else {
                showSnackbar(t('profile.userDataNotFound'), 'error');
                console.error("fetchShareCode: Nenhum documento encontrado para o usuário no Firestore com UID:", user.uid);
            }
        } catch (error) {
            console.error("fetchShareCode: Erro ao buscar código de partilha:", error);
            showSnackbar(t('profile.snackbarShareCodeError'), 'error');
        }
    }, [showSnackbar, t]); // Adicionado 't' às dependências

    const [currentAuthUserUid, setCurrentAuthUserUid] = useState<string | null>(null);
    const [isAuthInitializing, setIsAuthInitializing] = useState(true);

    useEffect(() => {
        console.log("useEffect [onAuthStateChanged]: Montado. Configurando listener.");
        const unsubscribe = auth.onAuthStateChanged(user => {
            const newUid = user ? user.uid : null;
            console.log(`onAuthStateChanged: Estado mudou. UID: ${newUid}, Anterior: ${currentAuthUserUid}`);
            setCurrentAuthUserUid(newUid);
            if (isAuthInitializing) {
                setIsAuthInitializing(false);
                console.log("onAuthStateChanged: Inicialização da autenticação concluída.");
            }
        });

        return () => {
            console.log("useEffect [onAuthStateChanged]: Desmontado. Removendo listener.");
            unsubscribe();
        };
    }, [currentAuthUserUid, isAuthInitializing]);

    useEffect(() => {
        let isComponentMounted = true;

        const loadData = async () => {
            console.log("useEffect [currentAuthUserUid]: Disparado. UID:", currentAuthUserUid);

            if (currentAuthUserUid === null && !isAuthInitializing) {
                if (isComponentMounted && isFocused) {
                    console.log("useEffect [currentAuthUserUid]: Usuário nulo (após inicialização) e focado. Redirecionando.");
                    showSnackbar(t('profile.sessionExpired'), 'error');
                    navigation.navigate('BoasVindasScreen');
                } else if (!isFocused) {
                    console.log("useEffect [currentAuthUserUid]: Usuário nulo (após inicialização) mas não focado. Não redirecionando.");
                }
                if (isComponentMounted) setIsLoadingUserData(false);
                return;
            } else if (currentAuthUserUid === null && isAuthInitializing) {
                console.log("useEffect [currentAuthUserUid]: Autenticação inicializando. Aguardando...");
                if (isComponentMounted) setIsLoadingUserData(true);
                setUserName(t('profile.loading'));
                setUserEmail(t('profile.loading'));
                return;
            }

            if (isComponentMounted) {
                setIsLoadingUserData(true);
                setUserName(t('profile.loading'));
                setUserEmail(t('profile.loading'));
            }

            try {
                console.log("useEffect [currentAuthUserUid]: Carregando dados do Firestore para UID:", currentAuthUserUid);
                if (!currentAuthUserUid) {
                    throw new Error("UID do usuário é nulo.");
                }
                const userDocRef = doc(db as any, "usuarios", currentAuthUserUid);
                const userDocSnap = await getDoc(userDocRef);

                if (isComponentMounted) {
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUserName(userData.nome || '');
                        setUserEmail(userData.email || '');
                        setNotificationsEnabled(userData.notificationsEnabled ?? true);
                        setRequestStatus(userData.nutricionista?.requestStatus || 'idle');
                        console.log("useEffect [currentAuthUserUid]: Dados do usuário carregados com sucesso:", userData.nome);
                    } else {
                        console.log("useEffect [currentAuthUserUid]: Documento do usuário não encontrado no Firestore. UID:", currentAuthUserUid);
                        showSnackbar(t('profile.userDataNotFound'), 'error');
                        if (isComponentMounted && isFocused) {
                            navigation.navigate('BoasVindasScreen');
                        }
                    }
                }
            } catch (error) {
                console.error("useEffect [currentAuthUserUid]: Erro ao carregar dados do usuário do Firestore:", error);
                if (isComponentMounted) {
                    showSnackbar(t('profile.userDataLoadError'), 'error');
                    setUserName(t('profile.userDataLoadError'));
                    setUserEmail(t('profile.userDataLoadError'));
                }
            } finally {
                if (isComponentMounted) {
                    setIsLoadingUserData(false);
                    console.log("useEffect [currentAuthUserUid]: Carregamento de dados finalizado. isLoadingUserData:", false);
                }
            }
        };

        if (isFocused) {
            console.log("useEffect [currentAuthUserUid]: Tela focada. Iniciando loadData.");
            loadData();
        } else {
            console.log("useEffect [currentAuthUserUid]: Tela não focada. Não carregando dados ainda.");
        }

        return () => {
            isComponentMounted = false;
        };
    }, [currentAuthUserUid, navigation, showSnackbar, isFocused, isAuthInitializing, t]); // Adicione 't' aqui

    // Efeito para o Snackbar
    useEffect(() => {
        if (isSnackbarVisible) {
            Animated.timing(snackbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            const timer = setTimeout(() => {
                Animated.timing(snackbarAnim, { toValue: 100, duration: 300, useNativeDriver: true, }).start(() => setSnackbarVisible(false));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSnackbarVisible, snackbarAnim]);

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
        if (newState) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPlayBellAnimation(true);
        }

        try {
            await mockBackendApi.updateNotificationPreference(user.uid, newState);
            showSnackbar(t('profile.snackbarNotificationSuccess'), 'success');
        } catch (error) {
            console.error("Erro ao salvar preferência de notificação no Firestore:", error);
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
            console.error("Erro ao enviar solicitação ao nutricionista para o Firestore:", error);
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
            navigation.navigate('BoasVindasScreen');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showSnackbar(t('profile.snackbarLogoutError'), 'error');
        }
    }, [navigation, showSnackbar, t]);

    // NOVA FUNÇÃO: handleManageInfo para navegar
    const handleManageInfo = useCallback(() => {
        console.log('Navegando para a tela de Gerenciar Informações');
        navigation.navigate('GerenciarInformacoes'); // <--- Nome da rota da sua tela de gerenciamento
    }, [navigation]);


    const renderChipContent = () => {
        switch (requestStatus) {
            case 'loading':
                return <ActivityIndicator size="small" color="#121212" />;
            case 'sent':
                return (
                    <>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.chipButtonTextSent}>{t('profile.requestPending')}</Text>
                    </>
                );
            default:
                return (
                    <>
                        <MaterialCommunityIcons name="check" size={18} color="#121212" />
                        <Text style={styles.chipButtonText}>{t('profile.sendRequestButton')}</Text>
                    </>
                );
        }
    };


    return (
        <View style={styles.rootContainer}>
            <LinearGradient colors={['#181917', '#020500']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Cabeçalho com Nome e E-mail */}
                <View style={styles.header}>
                    {isAuthInitializing || isLoadingUserData ? (
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
                    onRequestClose={() => {
                        setIsShareCodeVisible(false);
                    }}
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
                            <Text style={styles.rowTitle}>{t('profile.notificationTitle')}</Text>
                            <Text style={styles.rowSubtitle}>{t('profile.notificationSubtitle')}</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: '#2E7D32' }}
                            thumbColor={notificationsEnabled ? '#AEF359' : '#f4f3f4'}
                            onValueChange={toggleSwitch}
                            value={notificationsEnabled}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Botão Gerenciar Informações com onPress */}
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

                    <View style={styles.textCard}>
                        {isAuthInitializing || isLoadingUserData ? (
                            <ActivityIndicator size="large" color="#AEF359" />
                        ) : (
                            <>

                                <MaterialCommunityIcons name="file-document-outline" size={48} color="#E0E0E0" />
                                <Text style={styles.requestCardText}>{t('profile.shareCodePrompt')}</Text>

                                {/* Ambos os botões: Gerar Código e Enviar Solicitação */}
                                <TouchableOpacity style={styles.shareButton} onPress={fetchShareCode}>
                                    <Text style={styles.shareButtonText}>{t('profile.generateCodeButton')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
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
    container: { // Este estilo não está sendo usado no <View> principal, mas mantido.
        flex: 1,
        paddingHorizontal: 24,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        position: 'relative',
        paddingBottom: 120, // Garante espaço para a navbar inferior se ela for implementada globalmente
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
    title: { // Este estilo não está sendo usado no JSX, pode ser removido.
        marginBottom: 20,
        width: '100%',
        alignItems: 'flex-start',
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
    sectionTitle: { // Não usado no JSX, pode ser removido.
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    sectionSubtitle: { // Não usado no JSX, pode ser removido.
        color: '#9E9E9E',
        fontSize: 16,
        marginTop: 4,
        marginBottom: 20,
    },
    requestCard: { // Não usado no JSX, pode ser removido.
        backgroundColor: '#181917',
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
    chipButton: { // Não usado no JSX, pode ser removido.
        flexDirection: 'row',
        backgroundColor: '#AEF359',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        minHeight: 48,
        marginTop: 15,
    },
    chipButtonText: { // Não usado no JSX, pode ser removido.
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    chipButtonSent: { // Não usado no JSX, pode ser removido.
        backgroundColor: '#333333',
    },
    chipButtonTextSent: { // Não usado no JSX, pode ser removido.
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
        shadowOffset: {
            width: 0,
            height: 4,
        },
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

export default ProfileScreenFinal;