import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const RecuperarSenhaScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handlePasswordReset = async () => {
    console.log('--- INICIANDO PROCESSO DE RECUPERAÇÃO ---');

    if (email.trim() === '') {
      Alert.alert(t('recuperarSenha.errorTitle'), t('recuperarSenha.emptyEmailError'));
      return;
    }

    setLoading(true);
    const userEmail = email.trim().toLowerCase();

    try {
      console.log(`Tentando enviar email de recuperação para: '${userEmail}'`);
      
      await sendPasswordResetEmail(auth, userEmail);
      
      console.log('Email de recuperação enviado com sucesso');
      setLoading(false);
      
      Alert.alert(
        t('recuperarSenha.successTitle'),
        t('recuperarSenha.emailSentMessage')
      );

    } catch (error: any) {
      setLoading(false);
      console.log(`Firebase retornou um erro. Código do erro: ${error.code}`);
      console.error('Detalhes do erro:', error);

      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          t('recuperarSenha.errorTitle'),
          t('recuperarSenha.emailNotFoundError')
        );
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert(
          t('recuperarSenha.errorTitle'),
          'Por favor, insira um endereço de email válido.'
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          t('recuperarSenha.errorTitle'),
          'Muitas tentativas foram feitas. Tente novamente mais tarde.'
        );
      } else {
        Alert.alert(
          t('recuperarSenha.errorTitle'),
          'Email não encontrado no sistema.'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.innerContainer}>
          <View>
            <Text style={styles.title}>{t('recuperarSenha.title')}</Text>
            <Text style={styles.subtitle}>
              {t('recuperarSenha.descriptionLine1')}{'\n'}
              {t('recuperarSenha.descriptionLine2')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('recuperarSenha.emailPlaceholder')}
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePasswordReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>{t('recuperarSenha.sendButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, paddingHorizontal: '5%' },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: -200,
    marginTop: 210,
    fontFamily: 'Fustat-Bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 36,
    marginBottom: 150,
    marginTop: 230,
    fontFamily: 'Fustat-Light',
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    width: '100%',
    minHeight: 60,
    fontSize: 16,
    fontFamily: 'Fustat-Regular',
  },
  button: {
    backgroundColor: '#82CD32',
    paddingVertical: 16,
    borderRadius: 30,
    marginVertical: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Fustat-Bold',
  },
  buttonDisabled: {
    backgroundColor: '#5a8e22',
  },
});

export default RecuperarSenhaScreen;
