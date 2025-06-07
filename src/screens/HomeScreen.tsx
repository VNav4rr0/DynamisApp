import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; // Importa os tipos definidos em App.tsx

// Define o tipo das props para a tela Home
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem Vindo, Usuário!</Text>
      <Text style={styles.subtitle}>Cada passo te aproxima do seu objetivo!</Text>
      {/* Conteúdo da sua Home aqui */}

      <Button
        title="Ir para Progresso Detalhado"
        onPress={() => navigation.navigate('ProgressoDetalhado')} // Navega para a tela de Progresso
        color="#6ad400" // Cor do botão
      />
      <Button
        title="Fazer Login"
        onPress={() => navigation.navigate('Login')} // Navega para a tela de Login
        color="#6ad400"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fundo preto
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto branco
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6ad400', // Texto verde
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default HomeScreen;