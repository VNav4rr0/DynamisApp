import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard,
    Dimensions, SafeAreaView, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../App';
import CustomAlertModal from '../components/CustomAlertModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';

const { height: screenHeight } = Dimensions.get('window');

type NutricionistaAccessScreenProps = NativeStackScreenProps<AuthStackParamList, 'NutricionistaAccess'> & {
    setClientSession: (session: { clientUid: string; clientName: string; }) => void;
};

const TOTAL_DIGITABLE_INPUTS = 8;
const PREFIX_CHARS_LENGTH = 3;

const NutricionistaAccessScreen: React.FC<NutricionistaAccessScreenProps> = ({ navigation, setClientSession }) => {
    const codeInputRefs = useRef<Array<TextInput | null>>([]);
    const [accessCodeParts, setAccessCodeParts] = useState<string[]>(Array(TOTAL_DIGITABLE_INPUTS).fill(''));
    const [isLoadingAccess, setIsLoadingAccess] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const showAlert = (title: string, message: string) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setIsAlertVisible(true);
    };

    const hideAlert = () => setIsAlertVisible(false);

    const handleCodeChange = (text: string, index: number) => {
        const newCodeParts = [...accessCodeParts];
        newCodeParts[index] = text.toUpperCase();
        setAccessCodeParts(newCodeParts);
        if (text.length === 1 && index < TOTAL_DIGITABLE_INPUTS - 1) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = useCallback(({ nativeEvent: { key } }: any, index: number) => {
        if (key === 'Backspace' && accessCodeParts[index].length === 0 && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    }, [accessCodeParts]);

    const handleAccessCodeVerify = async () => {
        const enteredChars = accessCodeParts.join('');
        if (enteredChars.length !== TOTAL_DIGITABLE_INPUTS) {
            showAlert('Erro', `Por favor, preencha o código completo.`);
            return;
        }

        const prefix = enteredChars.substring(0, PREFIX_CHARS_LENGTH);
        const suffix = enteredChars.substring(PREFIX_CHARS_LENGTH);
        const fullShareCode = `${prefix}-${suffix}`;

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

                setClientSession({
                    clientUid: clientUID,
                    clientName: clientData.nome || 'Cliente',
                });
            } else {
                showAlert('Erro', 'Código de acesso inválido ou não encontrado.');
            }
        } catch (error) {
            console.error("Erro ao verificar código:", error);
            showAlert('Erro', 'Ocorreu um erro ao verificar o código. Tente novamente.');
        } finally {
            setIsLoadingAccess(false);
        }
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
                                    autoCapitalize="characters"
                                />
                                {index === PREFIX_CHARS_LENGTH - 1 && <Text style={styles.codeDash}>-</Text>}
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
                        type={'error'}
                    />
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000000' },
    container: { flex: 1, paddingHorizontal: '5%', justifyContent: 'center', alignItems: 'center' },
    headerContainer: { alignItems: 'center', marginBottom: screenHeight * 0.05 },
    title: { marginTop: 50, fontSize: 28, fontFamily: 'Fustat-Bold', color: '#FFFFFF', textAlign: 'center' },
    subtitle: { fontSize: 18, fontFamily: 'Fustat-Light', color: '#FFFFFF', lineHeight: 24, textAlign: 'center', maxWidth: '80%' },
    codeInputsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginBottom: 30, alignItems: 'center' },
    codeInput: { backgroundColor: '#333', width: 35, height: 50, textAlign: 'center', borderRadius: 8, color: '#FFF', fontSize: 16, fontFamily: 'Fustat-Bold', marginHorizontal: 2, borderWidth: 1, borderColor: '#444' },
    codeDash: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginHorizontal: 2 },
    accessButton: { backgroundColor: '#AEF359', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, width: '80%', alignItems: 'center' },
    accessButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold', fontFamily: 'Fustat-Bold' },
});

export default NutricionistaAccessScreen;