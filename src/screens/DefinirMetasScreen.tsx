import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// --- CORREÇÃO APLICADA AQUI ---
// A tela agora importa a tipagem do seu próprio navegador, o AuthStack, que está no App.tsx.
// Certifique-se de que o tipo AuthStackParamList está exportado do seu App.tsx.
import { AuthStackParamList } from '../App'; 

type DefinirMetasScreenProps = NativeStackScreenProps<AuthStackParamList, 'DefinirMetas'>;

const DefinirMetasScreen: React.FC<DefinirMetasScreenProps> = ({ navigation }) => {

  // Esta função representa a ação final do onboarding.
  // No futuro, ela guardaria as metas no Firebase.
  // Após guardar, ela navega para a tela de Login, "fechando" o ciclo de registo.
  const finalizarOnboarding = () => {
    console.log("Metas definidas. O utilizador deve agora fazer login.");
    // Ao navegar para Login, o utilizador pode entrar e o "guarda" no App.tsx fará a troca de mundos.
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Defina Suas Metas</Text>
      <Text style={styles.subtitle}>Este é o último passo para começar a sua transformação.</Text>
      
      {/* O conteúdo para definir as metas (inputs, seletores, etc.) viria aqui */}

      {/* O botão agora tem uma ação clara: finalizar o processo. */}
      <Button
        title="Concluir e Ir para Login"
        onPress={finalizarOnboarding}
        color="#6ad400"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6ad400',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default DefinirMetasScreen;
