import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomAlertModal from '../components/CustomAlertModal';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CadastroInicialScreenProps = NativeStackScreenProps<RootStackParamList, 'CadastroInicial'>;

const CadastroInicialScreen: React.FC<CadastroInicialScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  // ... (toda a sua lógica de estados e funções permanece a mesma)
  const [step, setStep] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [altura, setAltura] = useState('');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [objective, setObjective] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nomeError, setNomeError] = useState(false);
  const [idadeError, setIdadeError] = useState(false);
  const [alturaError, setAlturaError] = useState(false);
  const [genderError, setGenderError] = useState(false);
  const [activityLevelError, setActivityLevelError] = useState(false);
  const [currentWeightError, setCurrentWeightError] = useState(false);
  const [targetWeightError, setTargetWeightError] = useState(false);
  const [objectiveError, setObjectiveError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [senhaError, setSenhaError] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertVisible(true);
  };

  const hideAlert = () => {
    setIsAlertVisible(false);
  };

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (step + 1) / 4,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const validateStep = (): boolean => {
    Keyboard.dismiss();
    let isValid = true;
    setNomeError(false);
    setIdadeError(false);
    setAlturaError(false);
    setGenderError(false);
    setActivityLevelError(false);
    setCurrentWeightError(false);
    setTargetWeightError(false);
    setObjectiveError(false);
    setEmailError(false);
    setSenhaError(false);
    let specificErrorMessage = '';
    if (step === 0) {
      if (!nome.trim()) { setNomeError(true); isValid = false; specificErrorMessage = t('cadastro.nameRequired'); }
      if (!idade.trim() || isNaN(Number(idade)) || Number(idade) <= 0) { setIdadeError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.validAge'); }
      if (!altura.trim() || isNaN(Number(altura)) || Number(altura) <= 0) { setAlturaError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.validHeight'); }
    } else if (step === 1) {
      if (!selectedGender) { setGenderError(true); isValid = false; specificErrorMessage = t('cadastro.selectGender'); }
      if (!activityLevel) { setActivityLevelError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.selectActivityLevel'); }
    } else if (step === 2) {
      if (!currentWeight.trim() || isNaN(Number(currentWeight)) || Number(currentWeight) <= 0) { setCurrentWeightError(true); isValid = false; specificErrorMessage = t('cadastro.validCurrentWeight'); }
      if (!targetWeight.trim() || isNaN(Number(targetWeight)) || Number(targetWeight) <= 0) { setTargetWeightError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.validTargetWeight'); }
      if (!objective) { setObjectiveError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.selectObjective'); }
    } else if (step === 3) {
      if (!email.trim()) { setEmailError(true); isValid = false; specificErrorMessage = t('cadastro.emailRequired'); }
      else if (!email.includes('@')) { setEmailError(true); isValid = false; specificErrorMessage = t('cadastro.emailMissingAt'); }
      else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError(true); isValid = false; specificErrorMessage = t('cadastro.validEmail');}
      if (!senha.trim()) { setSenhaError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.passwordRequired'); }
      else if (senha.length < 6) { setSenhaError(true); isValid = false; if (!specificErrorMessage) specificErrorMessage = t('cadastro.passwordMinLength'); }
    }
    if (!isValid) { showAlert(t('cadastro.requiredFields'), specificErrorMessage || t('cadastro.fillAllFields'), 'error'); }
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        showAlert(t('cadastro.registrationCompleteTitle'), t('cadastro.registrationCompleteMessage'), 'success');
        setTimeout(() => { navigation.navigate('Login'); }, 1500);
      }
    }
  };

  const widthInterpolated = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const activityLevelOptions = [
    { label: t('cadastro.activityLevelLight'), value: 'leve' },
    { label: t('cadastro.activityLevelModerate'), value: 'moderado' },
    { label: t('cadastro.activityLevelIntense'), value: 'intenso' },
  ];
  const objectiveOptions = [
    { label: t('cadastro.objectiveLoseWeight'), value: 'emagrecer' },
    { label: t('cadastro.objectiveGainMuscle'), value: 'ganhar_massa' },
    { label: t('cadastro.objectiveMaintainWeight'), value: 'manter_peso' },
    { label: t('cadastro.objectiveMuscleDefinition'), value: 'definicao' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View>
          <Text style={styles.title}>{t('cadastro.title')}</Text>
          <Text style={styles.subtitle}>
            {step === 0 && t('cadastro.subtitle1')}
            {step === 1 && t('cadastro.subtitle2')}
            {step === 2 && t('cadastro.subtitle3')}
            {step === 3 && t('cadastro.subtitle4')}
          </Text>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: widthInterpolated }]} />
          </View>
        </View>

        {/* Container central para os formulários */}
        <View style={styles.formContainer}>
          {/* ... (todo o seu conteúdo de formulário aqui, sem alterações) ... */}
          {step === 0 && (
            <>
              <TextInput
                placeholder={t('cadastro.namePlaceholder')}
                placeholderTextColor="#ccc"
                style={[styles.input, nomeError ? styles.inputError : null]}
                value={nome}
                onChangeText={(text) => { setNome(text); setNomeError(false); }}
              />
              <View style={styles.inputRow}>
                <TextInput
                  placeholder={t('cadastro.agePlaceholder')}
                  placeholderTextColor="#ccc"
                  style={[styles.inputHalf, idadeError ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={idade}
                  onChangeText={(text) => { setIdade(text); setIdadeError(false); }}
                />
                <TextInput
                  placeholder={t('cadastro.heightPlaceholder')}
                  placeholderTextColor="#ccc"
                  style={[styles.inputHalf, alturaError ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={altura}
                  onChangeText={(text) => { setAltura(text); setAlturaError(false); }}
                />
              </View>
            </>
          )}
          {step === 1 && (
            <>
              <View style={[styles.genderSelectionContainer, genderError ? styles.inputError : null]}>
                <TouchableOpacity
                  style={[styles.genderButton, selectedGender === 'Homem' && styles.genderButtonSelected]}
                  onPress={() => { setSelectedGender('Homem'); setGenderError(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderButtonText, selectedGender === 'Homem' && styles.genderButtonTextSelected]}>
                    {selectedGender === 'Homem' && '✓ '}{t('cadastro.genderMan')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, selectedGender === 'Mulher' && styles.genderButtonSelected]}
                  onPress={() => { setSelectedGender('Mulher'); setGenderError(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderButtonText, selectedGender === 'Mulher' && styles.genderButtonTextSelected]}>
                    {selectedGender === 'Mulher' && '✓ '}{t('cadastro.genderWoman')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.pickerContainer, activityLevelError ? styles.inputError : null]}>
                <RNPickerSelect
                  onValueChange={(value) => { setActivityLevel(value); setActivityLevelError(false); }}
                  value={activityLevel}
                  placeholder={{ label: t('cadastro.activityLevelPlaceholder'), value: null, color: '#ccc', }}
                  items={activityLevelOptions}
                  style={{ inputIOS: styles.pickerInput, inputAndroid: styles.pickerInput, placeholder: { color: '#ccc' }, iconContainer: { top: '50%', marginTop: -10, right: 15, position: 'absolute' } }}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Icon name="chevron-down-outline" size={20} color="#ccc" />}
                />
              </View>
            </>
          )}
          {step === 2 && (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder={t('cadastro.currentWeightPlaceholder')}
                  placeholderTextColor="#ccc"
                  style={[styles.inputHalfStep3, currentWeightError ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={(text) => { setCurrentWeight(text); setCurrentWeightError(false); }}
                />
                <Text style={styles.arrowIcon}>{t('cadastro.arrowIcon')}</Text>
                <TextInput
                  placeholder={t('cadastro.targetWeightPlaceholder')}
                  placeholderTextColor="#ccc"
                  style={[styles.inputHalfStep3, targetWeightError ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={(text) => { setTargetWeight(text); setTargetWeightError(false); }}
                />
              </View>
              <View style={[styles.pickerContainer, objectiveError ? styles.inputError : null]}>
                <RNPickerSelect
                  onValueChange={(value) => { setObjective(value); setObjectiveError(false); }}
                  value={objective}
                  placeholder={{ label: t('cadastro.objectivePlaceholder'), value: null, color: '#ccc', }}
                  items={objectiveOptions}
                  style={{ inputIOS: styles.pickerInput, inputAndroid: styles.pickerInput, placeholder: { color: '#ccc' }, iconContainer: { top: '50%', marginTop: -10, right: 15, position: 'absolute' } }}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Icon name="chevron-down-outline" size={20} color="#ccc" />}
                />
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <TextInput
                placeholder={t('cadastro.emailPlaceholder')}
                placeholderTextColor="#ccc"
                style={[styles.input, emailError ? styles.inputError : null]}
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => { setEmail(text); setEmailError(false); }}
              />
              <View style={[styles.passwordInputContainer, senhaError ? styles.inputError : null]}>
                <TextInput
                  placeholder={t('cadastro.passwordPlaceholder')}
                  placeholderTextColor="#ccc"
                  style={styles.passwordTextInput}
                  secureTextEntry={!showPassword}
                  value={senha}
                  onChangeText={(text) => { setSenha(text); setSenhaError(false); }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggleIcon}
                  activeOpacity={0.7}
                >
                  <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#ccc" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Botão no final da tela */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleNextStep} activeOpacity={0.7}>
            {step === 3 ? (
              <ImageBackground
                source={require('../../assets/finalizar.png')}
                style={styles.roundedButton}
                imageStyle={{ borderRadius: 30 }}
              >
                <Text 
                  style={styles.buttonText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {t('cadastro.finishButton')}
                </Text>
              </ImageBackground>
            ) : (
              <View style={styles.roundedButton}>
                <Text 
                  style={styles.buttonText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {t('cadastro.continueButton')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        type={alertType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: '5%',
    paddingTop: screenHeight * 0.10, // Reduzi um pouco o padding geral do topo
  },
  title: {
    fontSize: screenWidth * 0.06,
    fontFamily: 'Fustat-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: screenWidth * 0.09,
    fontFamily: 'Fustat-Light',
    color: '#FFFFFF',
    lineHeight: screenWidth * 0.12,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: '#888',
    width: '100%',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E80095',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Alinha no topo do container
    paddingTop: screenHeight * 0.17, // Adiciona um espaço para não colar no header
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    minHeight: 60,
    fontSize: screenWidth * 0.04,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  inputHalf: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    minHeight: 60,
    fontSize: screenWidth * 0.04,
  },
  buttonContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  roundedButton: {
    backgroundColor: '#82CD32',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: screenWidth * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#020003',
    fontSize: screenWidth * 0.045,
    fontWeight: '500',
    textAlign: 'center',
  },
  genderSelectionContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 15,
    width: '100%',
    minHeight: 50,
  },
  genderButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  genderButtonSelected: {
    backgroundColor: '#333333',
  },
  genderButtonText: {
    color: '#ccc',
    fontSize: screenWidth * 0.04,
    fontFamily: 'Fustat-Regular',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Fustat-Bold',
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    minHeight: 60,
    justifyContent: 'center',
    width: '100%',
  },
  pickerInput: {
    color: '#fff',
    fontSize: screenWidth * 0.04,
    paddingVertical: 12,
  },
  inputHalfStep3: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '40%',
    minHeight: 60,
    textAlign: 'center',
    fontSize: screenWidth * 0.04,
  },
  arrowIcon: {
    color: '#E80095',
    fontSize: screenWidth * 0.08,
    fontFamily: 'Fustat-Bold',
  },
  inputError: {
    borderColor: '#FF6347',
    borderWidth: 2,
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
    fontSize: screenWidth * 0.04,
  },
  passwordToggleIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
});

export default CadastroInicialScreen;