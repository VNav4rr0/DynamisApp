import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Importe suas telas aqui
// Assegure-se de que o caminho está correto
import HomeScreen from './screens/HomeScreen';
import ProgressoDetalhadoScreen from './screens/ProgressoDetalhadoScreen';
import CadastroInicialScreen from './screens/CadastroInicialScreen';
import DefinirMetasScreen from './screens/DefinirMetasScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  CadastroInicial: undefined;
  DefinirMetas: undefined;
  Login: undefined;
  // Adicione outras telas aqui se tiver parâmetros
  // DetalheItem: { itemId: string; };
};

export default function App() {
  return (
    <NavigationContainer>
      <>
        <Stack.Navigator initialRouteName="Login" screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' }
        }}>
          {/* Telas de Autenticação/Cadastro */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
          <Stack.Screen name="DefinirMetas" component={DefinirMetasScreen} />

          {/* Telas Principais do App */}
          <Stack.Screen name="Home">
            {(props: NativeStackScreenProps<RootStackParamList, 'Home'>) => <HomeScreen {...props} />}
          </Stack.Screen>
          <Stack.Screen name="ProgressoDetalhado">
            {(props: NativeStackScreenProps<RootStackParamList, 'ProgressoDetalhado'>) => <ProgressoDetalhadoScreen {...props} />}
          </Stack.Screen>
          {/* Adicione outras telas aqui com o mesmo padrão se tiver o erro */}
        </Stack.Navigator>
        <StatusBar style="light" />
      </>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // Se precisar de estilos para o container principal do app, etc.
});