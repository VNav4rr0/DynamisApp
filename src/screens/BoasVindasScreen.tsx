import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; // Importa os tipos definidos em App.tsx
import { Button } from 'react-native-paper';

// Define o tipo das props para a tela Home
type BoasVindasScreenProps = NativeStackScreenProps<RootStackParamList, 'BoasVindas'>;

const BoasVindasScreen: React.FC<BoasVindasScreenProps> = ({ navigation }) => {
  return (
    <ImageBackground source={require('../../assets/background.png')} style={styles.container}>
      <View>
      <Image
        source={require('../../assets/Logotipo.png')}
        style={{ width: 180, height: 100 }}
        resizeMode="contain"
      />
      <Text style={styles.title}>Transformação real acontece um passo de cada vez.</Text>
      </View>

      <View style={styles.contButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          buttonColor="#6ad400"
          textColor="#020003"
          style={{ ...styles.Button, marginBottom: 10 }}
        >
          Entrar
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('CadastroInicial')}
          textColor='#6ad400'
          style={{ ...styles.Button, borderColor: '#6ad400' }}
        >
          Cadastrar
        </Button>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fundo preto
    justifyContent: 'space-between',
    padding: 16,
    paddingVertical: 72,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Fustat-ExtraBold', // <--- Usamos o nome da fonte que JÁ É negrito
    fontSize: 36,
    lineHeight: 40,
    color: '#6ad400',
  },
  subtitle: {
    fontFamily: 'Fustat-Regular', // Fonte padrão do React Native
    fontSize: 16,
    color: '#6ad400', // Texto verde
    textAlign: 'center',
    marginBottom: 20,
  },
  contButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  Button: {
    padding: 8,
    width: '50%',
    borderRadius: 100,
    fontFamily: 'Fustat-Regular', // Fonte do botão
  },
});

export default BoasVindasScreen;