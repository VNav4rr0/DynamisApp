import React, { useState, useRef } from 'react';
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
// A sua tipagem deve vir do seu navegador de autenticação, não do App.tsx geral.
// Verifique o guia `dynamis_definitive_fix_v2` para a estrutura correta.
import { AuthStackParamList } from '../App'; 
import { Ionicons } from '@expo/vector-icons'; // Sua correção está correta
import { useTranslation } from 'react-i18next';
import CustomAlertModal from '../components/CustomAlertModal';

// Usando a sintaxe de compatibilidade que definimos no firebaseConfig.ts
import { auth } from '../../firebaseConfig/firebase';

const { height: screenHeight } = Dimensions.get('window');

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [senhaError, setSenhaError] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [verifiedModalVisible, setVerifiedModalVisible] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      alert('Por favor, preencha o e-mail e a senha.');
      return;
    }
    
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      await auth.signInWithEmailAndPassword(email, senha);
      // O "Guarda" no App.tsx fará a troca de telas automaticamente.
    } catch (error: any) {
      console.error("Erro no login: ", error);
      alert('Erro de Login: O e-mail ou a senha estão incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.toUpperCase();
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeVerify = () => {
    const enteredCode = code.join('');
    if (enteredCode.length === 6) {
      setCodeModalVisible(false);
      setVerifiedModalVisible(true);
    } else {
      alert('Por favor, digite o código completo de 6 dígitos.');
    }
  };

  const handleVerifiedClose = () => {
    setVerifiedModalVisible(false);
    setCode(['', '', '', '', '', '']);
    // A navegação não é mais necessária aqui
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitleLine1')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitleLine2')}</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor="#ccc"
              style={[styles.input, emailError && styles.inputError]}
              keyboardType="email-address"
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                setEmailError(false);
              }}
              autoCapitalize="none"
            />

            <View style={[styles.passwordInputContainer, senhaError && styles.inputError]}>
              <TextInput
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#ccc"
                style={styles.passwordTextInput}
                secureTextEntry={!showPassword}
                value={senha}
                onChangeText={(text: string) => {
                  setSenha(text);
                  setSenhaError(false);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggleIcon}
                activeOpacity={0.7}
              >
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#ccc" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('RecuperarSenha')}
            >
              <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} disabled={isLoading}>
              <View style={styles.roundedButton}>
                {isLoading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCodeModalVisible(true)}
              style={styles.codeButton}
              activeOpacity={0.8}
            >
              <Text style={styles.codeButtonText}>{t('login.enterWithCode')}</Text>
            </TouchableOpacity>
          </View>

          {/* Code Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={codeModalVisible}
            onRequestClose={() => setCodeModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.codeModalContent}>
                <Ionicons name="lock-closed-outline" size={40} color="#82CD32" />
                <Text style={styles.codeModalTitle}>Digite o código</Text>
                <Text style={styles.codeModalSubtitle}>
                  Insira o código de 6 dígitos enviado para você
                </Text>
                
                <View style={styles.codeInputsRow}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      keyboardType="default"
                      maxLength={1}
                      autoCapitalize="characters"
                    />
                  ))}
                </View>

                <View style={styles.codeModalActions}>
                  <TouchableOpacity onPress={() => setCodeModalVisible(false)}>
                    <Text style={styles.codeBackText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCodeVerify} style={styles.codeVerifyButton}>
                    <Text style={styles.codeVerifyText}>Verificar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Verified Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={verifiedModalVisible}
            onRequestClose={handleVerifiedClose}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.verifiedModal}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#82CD32" />
                <Text style={styles.verifiedTitle}>Código Verificado!</Text>
                <Text style={styles.verifiedSubtitle}>
                  Seu código foi verificado com sucesso. Você será redirecionado.
                </Text>
                <TouchableOpacity onPress={handleVerifiedClose} style={styles.verifiedButton}>
                  <Text style={styles.verifiedButtonText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: {
    marginTop: 60,
    flex: 1,
    paddingHorizontal: '5%',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: screenHeight * 0.05,
  },
  title: {
    marginTop: 50,
    fontSize: 28,
    fontFamily: 'Fustat-Bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 30,
    fontFamily: 'Fustat-Light',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  formContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.02,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    minHeight: 60,
    fontSize: 16,
    fontFamily: 'Fustat-Regular',
  },
  passwordInputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    width: '100%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  passwordTextInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    paddingLeft: 15,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Fustat-Regular',
  },
  passwordToggleIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  inputError: {
    borderColor: '#FF6347',
    borderWidth: 1,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Fustat-Medium',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 180,
  },
  roundedButton: {
    backgroundColor: '#82CD32',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 58,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Fustat-Bold',
  },
  codeButton: {
    borderColor: '#82CD32',
    borderWidth: 1.5,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeButtonText: {
    color: '#82CD32',
    fontSize: 16,
    fontFamily: 'Fustat-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeModalContent: {
    width: '85%',
    backgroundColor: '#111',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  codeModalTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Fustat-Bold',
    marginTop: 10,
  },
  codeModalSubtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: 'Fustat-Regular',
  },
  codeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#1a1a1a',
    width: 40,
    height: 50,
    textAlign: 'center',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Fustat-Bold',
  },
  codeModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  codeBackText: {
    color: '#82CD32',
    fontSize: 16,
    fontFamily: 'Fustat-Regular',
    alignSelf: 'center',
  },
  codeVerifyButton: {
    backgroundColor: '#82CD32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  codeVerifyText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Fustat-Bold',
  },
  verifiedModal: {
    width: '85%',
    backgroundColor: '#111',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  verifiedTitle: {
    fontSize: 20,
    fontFamily: 'Fustat-Bold',
    color: '#fff',
    marginVertical: 10,
  },
  verifiedSubtitle: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Fustat-Regular',
    marginBottom: 25,
  },
  verifiedButton: {
    backgroundColor: '#82CD32',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  verifiedButtonText: {
    color: '#000',
    fontFamily: 'Fustat-Bold',
    fontSize: 16,
  },
});

export default LoginScreen;
