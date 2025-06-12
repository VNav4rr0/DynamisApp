import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const { height: screenHeight } = Dimensions.get('window');

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [senhaError, setSenhaError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { t } = useTranslation();

  const validateFields = (): boolean => {
    Keyboard.dismiss();
    let isValid = true;

    setEmailError(false);
    setSenhaError(false);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      isValid = false;
    }

    if (!senha.trim() || senha.length < 6) {
      setSenhaError(true);
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = () => {
    if (validateFields()) {
      console.log('Login com:', { email, senha });
      navigation.navigate('ProgressoDetalhado');
    } else {
      setModalVisible(true);
    }
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
              onChangeText={(text) => {
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
                onChangeText={(text) => {
                  setSenha(text);
                  setSenhaError(false);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggleIcon}
                activeOpacity={0.7}
              >
                <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#ccc" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>
                {t('login.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
              <View style={[styles.roundedButton, { backgroundColor: '#82CD32' }]}>
                <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Modal Customizado */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('cadastro.requiredFields')}</Text>
                <Text style={styles.modalText}>{t('cadastro.fillAllFields')}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
    fontSize: 30,
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
    marginBottom: screenHeight * 0.03,
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Fustat-Medium',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  roundedButton: {
    marginTop: 200,
    backgroundColor: '#82CD32',
    paddingHorizontal: 170,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Fustat-Bold',
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: '#FF6347',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Fustat-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Fustat-Regular',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#82CD32',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Fustat-Bold',
  },
});

export default LoginScreen;
