import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native'; // O StyleSheet não era usado, mas pode ser útil. A View é necessária.
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// --- Imports do React Native Paper ---
import { 
  MD3DarkTheme,
  Provider as PaperProvider 
} from 'react-native-paper';

import BoasVindasScreen from './screens/BoasVindasScreen';
import HomeScreen from './screens/HomeScreen';
import ProgressoDetalhadoScreen from './screens/ProgressoDetalhadoScreen';
import CadastroInicialScreen from './screens/CadastroInicialScreen';
import DefinirMetasScreen from './screens/DefinirMetasScreen';
import LoginScreen from './screens/LoginScreen';


export type RootStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  CadastroInicial: undefined;
  DefinirMetas: undefined;
  Login: undefined;
  BoasVindas: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Configuração do Tema Customizado (seu código aqui estava correto) ---
const theme = {
  ...MD3DarkTheme,
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: {
      fontFamily: 'Fustat-Regular',
      fontWeight: 'normal' as 'normal',
    },
    medium: {
      fontFamily: 'Fustat-Medium',
      fontWeight: 'normal' as 'normal',
    },
    bold: {
      fontFamily: 'Fustat-Bold',
      fontWeight: 'normal' as 'normal',
    },
  },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Fustat-Regular': require('../assets/font/static/Fustat-Regular.ttf'),
    'Fustat-Bold': require('../assets/font/static/Fustat-Bold.ttf'),
    'Fustat-Medium': require('../assets/font/static/Fustat-Medium.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (fontError) {
    console.error("Erro ao carregar fontes:", fontError);
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="BoasVindas"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' }
            }}
          >
            <Stack.Screen name="BoasVindas" component={BoasVindasScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
            <Stack.Screen name="DefinirMetas" component={DefinirMetasScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProgressoDetalhado" component={ProgressoDetalhadoScreen} />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </View>
  );
}