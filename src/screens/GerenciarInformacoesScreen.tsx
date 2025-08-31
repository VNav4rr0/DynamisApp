import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import RNPickerSelect from 'react-native-picker-select';
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser, updatePassword, updateEmail } from 'firebase/auth';
import CustomAlertModal from '../components/CustomAlertModal';

const GerenciarInformacoesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // Adicionado o objeto i18n

  // Estados para os dados do usuário
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [altura, setAltura] = useState('');
  const [genero, setGenero] = useState<'Homem' | 'Mulher' | null>(null);
  const [pesoAtual, setPesoAtual] = useState('');
  const [pesoMeta, setPesoMeta] = useState('');
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [nivelAtividade, setNivelAtividade] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Estados para controlar a visibilidade dos campos de senha e do texto da senha
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Estados de erro para validação
  const [nomeError, setNomeError] = useState(false);
  const [idadeError, setIdadeError] = useState(false);
  const [alturaError, setAlturaError] = useState(false);
  const [generoError, setGeneroError] = useState(false);
  const [pesoAtualError, setPesoAtualError] = useState(false);
  const [pesoMetaError, setPesoMetaError] = useState(false);
  const [objetivoError, setObjetivoError] = useState(false);
  const [nivelAtividadeError, setNivelAtividadeError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [senhaError, setSenhaError] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);

  // Estado para o idioma selecionado
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  // Estados para loading e modal de alerta
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
  }, []);

  // Opções para os Pickers (Objetivo, Nível de Atividade e Idioma)
  const objectiveOptions = [
    { label: t('cadastro.objectiveLoseWeight'), value: 'emagrecer' },
    { label: t('cadastro.objectiveGainMuscle'), value: 'ganhar_massa' },
    { label: t('cadastro.objectiveMaintainWeight'), value: 'manter_peso' },
    { label: t('cadastro.objectiveMuscleDefinition'), value: 'definicao' },
  ];

  const activityLevelOptions = [
    { label: t('cadastro.activityLevelLight'), value: 'leve' },
    { label: t('cadastro.activityLevelModerate'), value: 'moderado' },
    { label: t('cadastro.activityLevelIntense'), value: 'intenso' },
  ];

  const languageOptions = [
    { label: 'Português', value: 'pt' },
    { label: 'English', value: 'en' },
  ];

  // --- Carregar dados do usuário ao montar a tela ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        showAlert(t('manageInfo.authErrorTitle'), t('manageInfo.notLoggedInMessage'), 'error');
        setIsLoading(false);
        navigation.goBack();
        return;
      }

      try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          const dadosPessoais = userData.dadosPessoais || {};
          const metas = userData.metas || {};

          setNome(userData.nome || '');
          setIdade(String(dadosPessoais.idade || ''));
          setAltura(String(dadosPessoais.altura || ''));
          setGenero(dadosPessoais.genero as 'Homem' | 'Mulher' || null);

          setPesoAtual(String(metas.pesoAtual || ''));
          setPesoMeta(String(metas.pesoMeta || ''));
          setObjetivo(metas.objetivo || null);
          setNivelAtividade(metas.nivelAtividade || null);
          
          setEmail(userData.email || '');

        } else {
          showAlert(t('manageInfo.errorTitle'), t('manageInfo.userDataNotFoundMessage'), 'error');
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        showAlert(t('manageInfo.errorTitle'), t('manageInfo.failedToLoadInfoMessage'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [showAlert, navigation, t]);

  // Função para mudar o idioma
  const handleLanguageChange = useCallback((lang: string) => {
    if (lang) {
      i18n.changeLanguage(lang);
      setSelectedLanguage(lang);
    }
  }, [i18n]);

  // --- Funções de Validação ---
  const validateInputs = useCallback(() => {
    Keyboard.dismiss();
    let isValid = true;

    // Resetar erros
    setNomeError(false);
    setIdadeError(false);
    setAlturaError(false);
    setGeneroError(false);
    setPesoAtualError(false);
    setPesoMetaError(false);
    setObjetivoError(false);
    setNivelAtividadeError(false);
    setEmailError(false);
    setSenhaError(false);
    setCurrentPasswordError(false);

    if (!nome.trim()) { setNomeError(true); isValid = false; }
    if (!idade.trim() || isNaN(Number(idade)) || Number(idade) <= 0) { setIdadeError(true); isValid = false; }
    if (!altura.trim() || isNaN(Number(altura)) || Number(altura) <= 0) { setAlturaError(true); isValid = false; }
    if (genero === null) { setGeneroError(true); isValid = false; }
    if (!pesoAtual.trim() || isNaN(Number(pesoAtual)) || Number(pesoAtual) <= 0) { setPesoAtualError(true); isValid = false; }
    if (!pesoMeta.trim() || isNaN(Number(pesoMeta)) || Number(pesoMeta) <= 0) { setPesoMetaError(true); isValid = false; }
    if (objetivo === null) { setObjetivoError(true); isValid = false; }
    if (nivelAtividade === null) { setNivelAtividadeError(true); isValid = false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setEmailError(true); isValid = false; }
    
    // Lógica da senha agora depende de showPasswordFields
    if (showPasswordFields) {
      if (!currentPassword.trim()) {
        setCurrentPasswordError(true);
        isValid = false;
        showAlert(t('manageInfo.requiredFieldsTitle'), t('manageInfo.enterCurrentPasswordMessage'), 'error');
      }

      if (!senha.trim()) {
        setSenhaError(true);
        isValid = false;
        showAlert(t('manageInfo.requiredFieldsTitle'), t('manageInfo.enterNewPasswordMessage'), 'error');
      } else if (senha.length < 6) {
        setSenhaError(true);
        isValid = false;
        showAlert(t('manageInfo.weakPasswordTitle'), t('manageInfo.weakPasswordMessage'), 'error');
      }
    } else {
        const isEmailChanged = email !== (auth.currentUser?.email || '');
        if (isEmailChanged && !currentPassword.trim()) {
            setCurrentPasswordError(true);
            isValid = false;
            showAlert(t('manageInfo.confirmationNeededTitle'), t('manageInfo.emailChangeRequiresCurrentPasswordMessage'), 'error');
        }
    }

    return isValid;
  }, [nome, idade, altura, genero, pesoAtual, pesoMeta, objetivo, nivelAtividade, email, senha, currentPassword, showPasswordFields, showAlert, t]);


  // --- Salvar Alterações ---
  const handleSaveChanges = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      showAlert(t('manageInfo.authErrorTitle'), t('manageInfo.notLoggedInMessage'), 'error');
      setIsLoading(false);
      return;
    }

    try {
      const isEmailChanged = email !== user.email;
      const isPasswordChanged = showPasswordFields && senha.length > 0;

      if (isEmailChanged || isPasswordChanged) {
        if (!currentPassword.trim()) {
            showAlert(t('manageInfo.errorTitle'), t('manageInfo.currentPasswordRequiredForChanges'), 'error');
            setIsLoading(false);
            return;
        }
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      
      if (isEmailChanged) {
        await updateEmail(user, email);
      }

      if (isPasswordChanged) {
        await updatePassword(user, senha);
      }

      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, {
        nome: nome.trim(),
        dadosPessoais: {
          idade: Number(idade),
          altura: Number(altura),
          genero: genero,
        },
        metas: {
          pesoAtual: Number(pesoAtual),
          pesoMeta: Number(pesoMeta),
          objetivo: objetivo,
          nivelAtividade: nivelAtividade,
        },
        email: email.trim(),
      });

      showAlert(t('manageInfo.successTitle'), t('manageInfo.infoUpdatedMessage'), 'success');
      
      setShowPasswordFields(false);
      setSenha('');
      setCurrentPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);

    } catch (error: any) {
      console.error("Erro ao salvar alterações:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showAlert(t('manageInfo.authErrorInvalidPasswordTitle'), t('manageInfo.invalidCurrentPasswordMessage'), 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showAlert(t('manageInfo.reauthenticationNeededTitle'), t('manageInfo.sessionExpiredMessage'), 'error');
      } else if (error.code === 'auth/invalid-email') {
        showAlert(t('manageInfo.invalidEmailFormatTitle'), t('manageInfo.invalidEmailFormatMessage'), 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showAlert(t('manageInfo.invalidEmailFormatTitle'), t('manageInfo.emailAlreadyInUseMessage'), 'error');
      }
      else {
        showAlert(t('manageInfo.errorTitle'), t('manageInfo.updateErrorMessage'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [nome, idade, altura, genero, pesoAtual, pesoMeta, objetivo, nivelAtividade, email, senha, currentPassword, showPasswordFields, showAlert, validateInputs, t]);


  // --- Excluir Conta ---
  const handleDeleteAccount = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      showAlert(t('manageInfo.authErrorTitle'), t('manageInfo.notLoggedInMessage'), 'error');
      return;
    }

    const passwordToReauthenticate = currentPassword;

    if (!passwordToReauthenticate.trim()) {
        showAlert(t('manageInfo.reauthenticationNeededTitle'), t('manageInfo.enterCurrentPasswordMessage'), 'error');
        return;
    }

    setIsLoading(true);
    try {
        const credential = EmailAuthProvider.credential(user.email!, passwordToReauthenticate);
        await reauthenticateWithCredential(user, credential);

        const userDocRef = doc(db, "usuarios", user.uid);
        await deleteDoc(userDocRef);
        console.log("Dados do usuário excluídos do Firestore.");

        await deleteUser(user);
        console.log("Usuário excluído do Firebase Auth.");

        showAlert(t('manageInfo.accountDeletedTitle'), t('manageInfo.accountDeletedMessage'), 'success');
        navigation.navigate('BoasVindas' as never);
    } catch (error: any) {
        console.error("Erro ao excluir conta:", error);
        if (error.code === 'auth/requires-recent-login') {
            showAlert(t('manageInfo.reauthenticationNeededTitle'), t('manageInfo.reauthForDeleteMessage'), 'error');
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showAlert(t('manageInfo.authErrorInvalidPasswordTitle'), t('manageInfo.invalidCurrentPasswordMessage'), 'error');
        } else {
            showAlert(t('manageInfo.errorTitle'), t('manageInfo.deleteErrorMessage'), 'error');
        }
    } finally {
        setIsLoading(false);
    }
  }, [currentPassword, showAlert, navigation, t]);


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AEF359" />
        <Text style={styles.loadingText}>{t('manageInfo.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" style={{ marginBottom: -4 }} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerText}>{t('manageInfo.title')}</Text>
          <View style={styles.headerLine} />
        </View>
        {/* Adicionado o seletor de idioma */}
        <View style={styles.languageSelectorContainer}>
          <RNPickerSelect
            onValueChange={handleLanguageChange}
            value={selectedLanguage}
            placeholder={{}}
            items={languageOptions}
            style={languagePickerStyles}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Ionicons name="language" size={20} color="#AEF359" />}
          />
        </View>
      </View>

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('manageInfo.personalDataSectionTitle')}</Text>
        <TextInput
          placeholder={t('manageInfo.fullNamePlaceholder')}
          placeholderTextColor="#888"
          style={[styles.input, nomeError && styles.inputError]}
          value={nome}
          onChangeText={(text) => { setNome(text); setNomeError(false); }}
        />
        <View style={styles.row}>
          <TextInput
            placeholder={t('manageInfo.yourAgePlaceholder')}
            placeholderTextColor="#888"
            style={[styles.input, styles.halfInput, idadeError && styles.inputError]}
            keyboardType="numeric"
            value={idade}
            onChangeText={(text) => { setIdade(text); setIdadeError(false); }}
          />
          <TextInput
            placeholder={t('manageInfo.yourHeightPlaceholder')}
            placeholderTextColor="#888"
            style={[styles.input, styles.halfInput, alturaError && styles.inputError]}
            keyboardType="numeric"
            value={altura}
            onChangeText={(text) => { setAltura(text); setAlturaError(false); }}
          />
        </View>
        <View style={[styles.genderContainer, generoError && styles.inputError]}>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'Homem' && styles.genderButtonActive]}
            onPress={() => { setGenero('Homem'); setGeneroError(false); }}
          >
            {genero === 'Homem' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>{t('cadastro.genderMan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'Mulher' && styles.genderButtonActive]}
            onPress={() => { setGenero('Mulher'); setGeneroError(false); }}
          >
            {genero === 'Mulher' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>{t('cadastro.genderWoman')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('manageInfo.personalGoalsSectionTitle')}</Text>
        <View style={styles.row}>
          <TextInput
            placeholder={t('manageInfo.currentWeightPlaceholder')}
            placeholderTextColor="#888"
            style={[styles.input, styles.halfInput, pesoAtualError && styles.inputError]}
            keyboardType="numeric"
            value={pesoAtual}
            onChangeText={(text) => { setPesoAtual(text); setPesoAtualError(false); }}
          />
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={36} color="#C2185B" style={{ marginBottom: 8 }} />
          </View>
          <TextInput
            placeholder={t('manageInfo.targetWeightPlaceholder')}
            placeholderTextColor="#888"
            style={[styles.input, styles.halfInput, pesoMetaError && styles.inputError]}
            keyboardType="numeric"
            value={pesoMeta}
            onChangeText={(text) => { setPesoMeta(text); setPesoMetaError(false); }}
          />
        </View>
        <View style={[styles.input, objetivoError && styles.inputError, { padding: 0, height: 50, justifyContent: 'center' }]}>
          <RNPickerSelect
            onValueChange={(value) => { setObjetivo(value); setObjetivoError(false); }}
            value={objetivo}
            placeholder={{ label: t('cadastro.objectivePlaceholder'), value: null, color: '#888' }}
            items={objectiveOptions}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Ionicons name="chevron-down-outline" size={20} color="#888" />}
          />
        </View>
        <View style={[styles.input, nivelAtividadeError && styles.inputError, { padding: 0, height: 50, justifyContent: 'center' }]}>
          <RNPickerSelect
            onValueChange={(value) => { setNivelAtividade(value); setNivelAtividadeError(false); }}
            value={nivelAtividade}
            placeholder={{ label: t('cadastro.activityLevelPlaceholder'), value: null, color: '#888' }}
            items={activityLevelOptions}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Ionicons name="chevron-down-outline" size={20} color="#888" />}
          />
        </View>
      </View>

      {/* Conta */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('manageInfo.accountSectionTitle')}</Text>
        <TextInput
          placeholder={t('manageInfo.emailPlaceholder')}
          placeholderTextColor="#888"
          style={[styles.input, emailError && styles.inputError]}
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => { setEmail(text); setEmailError(false); }}
        />

        {!showPasswordFields ? (
          <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowPasswordFields(true)}>
            <MaterialIcons name="lock" size={20} color="#AEF359" />
            <Text style={styles.changePasswordButtonText}>{t('manageInfo.changePasswordButton')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Campo Senha Atual */}
            <View style={[styles.passwordInputContainer, currentPasswordError && styles.inputError]}>
              <TextInput
                placeholder={t('manageInfo.currentPasswordPlaceholder')}
                placeholderTextColor="#888"
                style={styles.passwordTextInput}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={(text) => { setCurrentPassword(text); setCurrentPasswordError(false); }}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.passwordVisibilityToggle}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Campo Nova Senha */}
            <View style={[styles.passwordInputContainer, senhaError && styles.inputError]}>
              <TextInput
                placeholder={t('manageInfo.newPasswordPlaceholder')}
                placeholderTextColor="#888"
                style={styles.passwordTextInput}
                secureTextEntry={!showNewPassword}
                value={senha}
                onChangeText={(text) => { setSenha(text); setSenhaError(false); }}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.passwordVisibilityToggle}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelPasswordChangeButton} onPress={() => {
              setShowPasswordFields(false);
              setSenha('');
              setCurrentPassword('');
              setSenhaError(false);
              setCurrentPasswordError(false);
              setShowCurrentPassword(false);
              setShowNewPassword(false);
            }}>
              <MaterialIcons name="cancel" size={20} color="#FF6347" />
              <Text style={styles.cancelPasswordChangeButtonText}>{t('manageInfo.cancelButton')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <MaterialIcons name="edit" size={20} color="#000" />
            <Text style={styles.saveButtonText}>{t('manageInfo.saveChangesButton')}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="red" />
        ) : (
          <>
            <MaterialIcons name="delete" size={20} color="red" />
            <Text style={styles.deleteButtonText}>{t('manageInfo.deleteAccountButton')}</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.warningText}>{t('manageInfo.permanentActionWarning')}</Text>

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        type={alertType}
      />
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: '#FFF',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF',
    paddingRight: 30,
  },
  iconContainer: {
    top: '50%',
    marginTop: -10,
    right: 15,
    position: 'absolute',
  },
  placeholder: {
    color: '#888',
  },
});

const languagePickerStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        color: '#AEF359',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#AEF359',
        paddingRight: 30,
    },
    iconContainer: {
        top: '50%',
        marginTop: -10,
        right: 0,
        position: 'absolute',
    },
    placeholder: {
        color: '#AEF359',
    },
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Altera a justificação
    marginBottom: 30,
  },
  backButton: {
    marginTop: -4,
  },
  headerText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerLine: {
    marginTop: 6,
    height: 2,
    backgroundColor: '#82CD32',
    borderRadius: 2,
    width: 180,
  },
  languageSelectorContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingRight: 12,
    minWidth: 120,
  },
  card: {
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  genderButtonActive: {
    backgroundColor: '#2E2E2E',
  },
  genderText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#AEF359',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
  },
  warningText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 10,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  changePasswordButtonText: {
    color: '#AEF359',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelPasswordChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 5,
    gap: 8,
  },
  cancelPasswordChangeButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  passwordTextInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  passwordVisibilityToggle: {
    padding: 8,
  },
});

export default GerenciarInformacoesScreen;