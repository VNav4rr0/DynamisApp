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
} from 'react-native';
import { useTranslation } from 'react-i18next';

const RecuperarSenhaScreen = () => {
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

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
            />
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{t('recuperarSenha.sendButton')}</Text>
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
    marginVertical: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Fustat-Bold',
  },
});

export default RecuperarSenhaScreen;
