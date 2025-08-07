import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Keyboard,
    Dimensions,
    SafeAreaView,
    TouchableWithoutFeedback,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types'; // Importação correta
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CustomAlertModal from '../components/CustomAlertModal';


import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig/firebase'; 


const { height: screenHeight } = Dimensions.get('window');

// <-- MUDANÇA AQUI: Removido "& AppStackParamList" que era desnecessário e causava erro.
type NutricionistaAccessScreenProps = NativeStackScreenProps<AuthStackParamList, 'NutricionistaAccess'>;

const TOTAL_DIGITABLE_INPUTS = 8;
const PREFIX_CHARS_LENGTH = 3; 

const NutricionistaAccessScreen: React.FC<NutricionistaAccessScreenProps> = ({ navigation }) => {
    const codeInputRefs = useRef<Array<TextInput | null>>([]);
    useEffect(() => { 
        if (codeInputRefs.current.length !== TOTAL_DIGITABLE_INPUTS) {
            codeInputRefs.current = Array(TOTAL_DIGITABLE_INPUTS).fill(null);
        }
    }, []); 

    const [accessCodeParts, setAccessCodeParts] = useState<string[]>(Array(TOTAL_DIGITABLE_INPUTS).fill(''));
    const [isLoadingAccess, setIsLoadingAccess] = useState(false);
    const { t } = useTranslation();

    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('error'); 

    const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setIsAlertVisible(true);
    }, []);

    const hideAlert = useCallback(() => setIsAlertVisible(false), []);

    const handleCodeChange = (text: string, index: number) => {
        const newCodeParts = [...accessCodeParts];
        const newText = text.toUpperCase().charAt(0);
        newCodeParts[index] = newText;
        
        setAccessCodeParts(newCodeParts);

        if (newText.length === 1 && index < TOTAL_DIGITABLE_INPUTS - 1) {
            codeInputRefs.current[index + 1]?.focus();
        } 
    };

    const handleKeyPress = useCallback(({ nativeEvent: { key } }: any, index: number) => {
        if (key === 'Backspace' && accessCodeParts[index].length === 0 && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    }, [accessCodeParts]);


    const handleAccessCodeVerify = async () => {
        const enteredChars = accessCodeParts.join(''); // Pega os 8 caracteres digitados
        
        if (enteredChars.length !== TOTAL_DIGITABLE_INPUTS) {
            showAlert('Erro de Código', `Por favor, preencha o código completo (${TOTAL_DIGITABLE_INPUTS} caracteres).`);
            return;
        }

        const prefix = enteredChars.substring(0, PREFIX_CHARS_LENGTH);
        const suffix = enteredChars.substring(PREFIX_CHARS_LENGTH);
        const fullShareCode = `${prefix}-${suffix}`;

        if (prefix !== 'DYN' || suffix.length !== 5 || !/^[A-Z0-9]{5}$/.test(suffix)) {
            showAlert('Erro de Código', 'Formato de código inválido. O código deve ser DYN-XXXXX (DYN seguido de 5 letras/números).');
            return;
        }
        
        setIsLoadingAccess(true);
        Keyboard.dismiss();

        try {
            const usersRef = collection(db, "usuarios");
            const q = query(usersRef, where("codigoPartilha", "==", fullShareCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const clientDoc = querySnapshot.docs[0];
                const clientData = clientDoc.data();
                const clientUID = clientDoc.id;

                showAlert('Sucesso', `Cliente ${clientData.nome || 'desconhecido'} encontrado! Redirecionando.`, 'success');
                
                setTimeout(() => {
                    navigation.navigate('Nutricionista', { clientUid: clientUID, clientName: clientData.nome });
                    setAccessCodeParts(Array(TOTAL_DIGITABLE_INPUTS).fill(''));
                }, 1500);

            } else {
                showAlert('Erro de Código', 'Código de acesso inválido ou não encontrado.');
            }
        } catch (error: any) {
            console.error("Erro ao verificar código de acesso:", error);
            if (error.code === 'permission-denied') {
                showAlert('Erro de Permissão', 'Acesso negado. Verifique as regras do Firestore (allow list: if true; ou allow list: if request.auth != null;).');
            } else {
                showAlert('Erro', 'Ocorreu um erro ao verificar o código. Tente novamente.');
            }
        } finally {
            setIsLoadingAccess(false);
        }
    };
    
    const handleVerifiedClose = () => {
        setAccessCodeParts(Array(TOTAL_DIGITABLE_INPUTS).fill(''));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Acesso Nutricionista</Text>
                        <Text style={styles.subtitle}>
                            Insira o código de partilha do seu cliente para gerenciar o plano.
                        </Text>
                    </View>

                    <View style={styles.codeInputsRow}>
                        {Array.from({ length: TOTAL_DIGITABLE_INPUTS }).map((_, index) => (
                            <React.Fragment key={index}>
                                <TextInput
                                    ref={(el) => { codeInputRefs.current[index] = el; }}
                                    style={styles.codeInput}
                                    value={accessCodeParts[index] || ''}
                                    onChangeText={(text) => handleCodeChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    maxLength={1}
                                    keyboardType="default"
                                    autoCapitalize="characters"
                                    returnKeyType={index === TOTAL_DIGITABLE_INPUTS - 1 ? "done" : "next"}
                                    onSubmitEditing={index === TOTAL_DIGITABLE_INPUTS - 1 ? handleAccessCodeVerify : undefined}
                                />
                                {index === PREFIX_CHARS_LENGTH -1 && (
                                    <Text style={styles.codeDash}>-</Text>
                                )}
                            </React.Fragment>
                        ))}
                    </View>

                    <TouchableOpacity onPress={handleAccessCodeVerify} style={styles.accessButton} disabled={isLoadingAccess}>
                        {isLoadingAccess ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <Text style={styles.accessButtonText}>Acessar Plano</Text>
                        )}
                    </TouchableOpacity>

                    <CustomAlertModal
                        isVisible={isAlertVisible}
                        title={alertTitle}
                        message={alertMessage}
                        onClose={hideAlert}
                        type={alertType} // Corrigido para usar o estado dinâmico
                    />
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000000' },
    container: {
        flex: 1,
        paddingHorizontal: '5%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: screenHeight * 0.05,
    },
    title: {
        marginTop: 50,
        fontSize: 28,
        fontFamily: 'Fustat-Bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Fustat-Light',
        color: '#FFFFFF',
        lineHeight: 24,
        textAlign: 'center',
        maxWidth: '80%',
    },
    codeInputsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 30,
        alignItems: 'center',
    },
    codeInput: {
        backgroundColor: '#333',
        width: 35,
        height: 50,
        textAlign: 'center',
        borderRadius: 8,
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'Fustat-Bold',
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: '#444',
    },
    codeDash: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 2,
    },
    accessButton: {
        backgroundColor: '#AEF359',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        width: '80%',
        alignItems: 'center',
    },
    accessButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Fustat-Bold',
    },
});

export default NutricionistaAccessScreen;