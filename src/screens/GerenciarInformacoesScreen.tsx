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
  const { t } = useTranslation();

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
  const [senha, setSenha] = useState(''); // Nova senha
  const [currentPassword, setCurrentPassword] = useState(''); // Senha atual para reautenticação

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

  // Opções para os Pickers (Objetivo e Nível de Atividade)
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

  // --- Carregar dados do usuário ao montar a tela ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        showAlert("Erro de Autenticação", "Você não está logado.", 'error');
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
          showAlert("Erro", "Dados do usuário não encontrados.", 'error');
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        showAlert("Erro", "Não foi possível carregar suas informações. Tente novamente.", 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [showAlert, navigation]);

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
    if (showPasswordFields) { // Apenas valida se os campos de senha estão visíveis
      if (!currentPassword.trim()) {
        setCurrentPasswordError(true);
        isValid = false;
        showAlert("Campos Obrigatórios", "Por favor, digite sua senha atual.", 'error');
      }

      if (!senha.trim()) {
        setSenhaError(true);
        isValid = false;
        showAlert("Campos Obrigatórios", "Por favor, digite a nova senha.", 'error');
      } else if (senha.length < 6) {
        setSenhaError(true);
        isValid = false;
        showAlert("Senha Fraca", "A nova senha deve ter pelo menos 6 caracteres.", 'error');
      }
    } else {
        // Se os campos de senha não estão visíveis, mas o e-mail foi alterado,
        // a senha atual ainda é necessária para reautenticação.
        const isEmailChanged = email !== (auth.currentUser?.email || '');
        if (isEmailChanged && !currentPassword.trim()) { // Apenas exige se o email mudou
            setCurrentPasswordError(true);
            isValid = false;
            showAlert("Confirmação Necessária", "Para alterar o e-mail, por favor, digite sua senha atual.", 'error');
        }
    }

    return isValid;
  }, [nome, idade, altura, genero, pesoAtual, pesoMeta, objetivo, nivelAtividade, email, senha, currentPassword, showPasswordFields, showAlert]);


  // --- Salvar Alterações ---
  const handleSaveChanges = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      showAlert("Erro de Autenticação", "Você não está logado.", 'error');
      setIsLoading(false);
      return;
    }

    try {
      const isEmailChanged = email !== user.email;
      const isPasswordChanged = showPasswordFields && senha.length > 0;

      // Reautenticação necessária se o e-mail for alterado OU se os campos de senha estiverem visíveis e uma nova senha for preenchida
      if (isEmailChanged || isPasswordChanged) {
        if (!currentPassword.trim()) {
            showAlert("Erro", "Senha atual é obrigatória para alterar e-mail ou senha.", 'error');
            setIsLoading(false);
            return;
        }
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Atualizar Email se mudou
      if (isEmailChanged) {
        await updateEmail(user, email);
      }

      // Atualizar Senha se foi fornecida uma nova e os campos estavam visíveis
      if (isPasswordChanged) {
        await updatePassword(user, senha);
      }

      // Atualizar dados no Firestore
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

      showAlert("Sucesso!", "Suas informações foram atualizadas com sucesso.", 'success');
      
      // Limpar campos de senha e ocultá-los após sucesso
      setShowPasswordFields(false);
      setSenha('');
      setCurrentPassword('');
      setShowCurrentPassword(false); // Resetar visibilidade do olho
      setShowNewPassword(false); // Resetar visibilidade do olho

    } catch (error: any) {
      console.error("Erro ao salvar alterações:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showAlert("Erro de Autenticação", "Senha atual inválida. Por favor, verifique.", 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showAlert("Reautenticação Necessária", "Sua sessão expirou. Por favor, faça login novamente para realizar esta alteração.", 'error');
      } else if (error.code === 'auth/invalid-email') {
        showAlert("Erro de E-mail", "O formato do e-mail é inválido.", 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showAlert("Erro de E-mail", "Este e-mail já está em uso por outra conta.", 'error');
      }
      else {
        showAlert("Erro ao Atualizar", "Não foi possível salvar suas alterações. Tente novamente.", 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [nome, idade, altura, genero, pesoAtual, pesoMeta, objetivo, nivelAtividade, email, senha, currentPassword, showPasswordFields, showAlert, validateInputs]);


  // --- Excluir Conta ---
  const handleDeleteAccount = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      showAlert("Erro de Autenticação", "Você não está logado.", 'error');
      return;
    }

    const passwordToReauthenticate = currentPassword; // Usa o mesmo campo de senha atual para exclusão

    if (!passwordToReauthenticate.trim()) {
        showAlert("Reautenticação Necessária", "Por favor, digite sua senha atual para excluir a conta.", 'error');
        return;
    }

    setIsLoading(true);
    try {
        const credential = EmailAuthProvider.credential(user.email!, passwordToReauthenticate);
        await reauthenticateWithCredential(user, credential);

        // 1. Excluir dados do Firestore
        const userDocRef = doc(db, "usuarios", user.uid);
        await deleteDoc(userDocRef);
        console.log("Dados do usuário excluídos do Firestore.");

        // 2. Excluir usuário do Firebase Auth
        await deleteUser(user);
        console.log("Usuário excluído do Firebase Auth.");

        showAlert("Conta Excluída", "Sua conta foi excluída com sucesso.", 'success');
        navigation.navigate('BoasVindas' as never); // Redireciona após exclusão
    } catch (error: any) {
        console.error("Erro ao excluir conta:", error);
        if (error.code === 'auth/requires-recent-login') {
            showAlert("Reautenticação Necessária", "Sua sessão expirou ou requer login recente. Por favor, faça login novamente e tente excluir a conta.", 'error');
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showAlert("Erro de Autenticação", "Senha atual inválida. Não foi possível excluir a conta.", 'error');
        } else {
            showAlert("Erro ao Excluir", "Não foi possível excluir sua conta. Tente novamente.", 'error');
        }
    } finally {
        setIsLoading(false);
    }
  }, [currentPassword, showAlert, navigation]);


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AEF359" />
        <Text style={styles.loadingText}>Carregando...</Text>
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
          <Text style={styles.headerText}>Gerenciar Informações</Text>
          <View style={styles.headerLine} />
        </View>
      </View>

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        <TextInput
          placeholder="Nome completo"
          placeholderTextColor="#888"
          style={[styles.input, nomeError && styles.inputError]}
          value={nome}
          onChangeText={(text) => { setNome(text); setNomeError(false); }}
        />
        <View style={styles.row}>
          <TextInput
            placeholder="Sua Idade"
            placeholderTextColor="#888"
            style={[styles.input, styles.halfInput, idadeError && styles.inputError]}
            keyboardType="numeric"
            value={idade}
            onChangeText={(text) => { setIdade(text); setIdadeError(false); }}
          />
          <TextInput
            placeholder="Sua Altura"
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
            <Text style={styles.genderText}>Homem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'Mulher' && styles.genderButtonActive]}
            onPress={() => { setGenero('Mulher'); setGeneroError(false); }}
          >
            {genero === 'Mulher' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>Mulher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Meta Pessoais</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Peso Atual"
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
            placeholder="Peso Meta"
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
            placeholder={{ label: "Objetivo", value: null, color: '#888' }}
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
            placeholder={{ label: "Nível de Atividades", value: null, color: '#888' }}
            items={activityLevelOptions}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Ionicons name="chevron-down-outline" size={20} color="#888" />}
          />
        </View>
      </View>

      {/* Conta */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <TextInput
          placeholder="E-mail"
          placeholderTextColor="#888"
          style={[styles.input, emailError && styles.inputError]}
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => { setEmail(text); setEmailError(false); }}
        />

        {!showPasswordFields ? (
          <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowPasswordFields(true)}>
            <MaterialIcons name="lock" size={20} color="#AEF359" />
            <Text style={styles.changePasswordButtonText}>Alterar Senha</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Campo Senha Atual */}
            <View style={[styles.passwordInputContainer, currentPasswordError && styles.inputError]}>
              <TextInput
                placeholder="Senha Atual"
                placeholderTextColor="#888"
                style={styles.passwordTextInput}
                secureTextEntry={!showCurrentPassword} // Controla a visibilidade
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
                placeholder="Nova Senha"
                placeholderTextColor="#888"
                style={styles.passwordTextInput}
                secureTextEntry={!showNewPassword} // Controla a visibilidade
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
              <Text style={styles.cancelPasswordChangeButtonText}>Cancelar</Text>
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
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="red" />
        ) : (
          <>
            <MaterialIcons name="delete" size={20} color="red" />
            <Text style={styles.deleteButtonText}>Excluir Conta</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.warningText}>Esta ação é permanente e não pode ser desfeita.</Text>

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
    paddingRight: 30, // para garantir que o texto não se sobreponha ao ícone
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF',
    paddingRight: 30, // para garantir que o texto não se sobreponha ao ícone
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
    marginBottom: 30,
    gap: 10,
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
  // ESTILOS PARA OS CAMPOS DE SENHA COM OLHO
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