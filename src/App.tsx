import React, { useCallback } from 'react';
import '../src/i18n';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Imports do React Native Paper
import { 
  MD3DarkTheme,
  Provider as PaperProvider 
} from 'react-native-paper';

// Imports das Telas
import BoasVindasScreen from '../src/screens/BoasVindasScreen';
import HomeScreen from '../src/screens/HomeScreen';
import ProgressoDetalhadoScreen from '../src/screens/ProgressoDetalhadoScreen';
import CadastroInicialScreen from '../src/screens/CadastroInicialScreen';
import DefinirMetasScreen from '../src/screens/DefinirMetasScreen';
import LoginScreen from '../src/screens/LoginScreen';
import PerfilScreen from '../src/screens/PerfilScreen';
import NutricionistaScreen from '../src/screens/NutricionistaScreen';

// Definição de tipo das telas para o navegador
export type RootStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  CadastroInicial: undefined;
  DefinirMetas: undefined;
  Login: undefined;
  BoasVindas: undefined;
  Perfil: undefined;
  Nutricionista: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuração do Tema Customizado com as fontes
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    outline: '#6ad400', // Cor da borda para botões 'outlined'
  },
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

// Mantém a splash screen visível durante o carregamento
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Fustat-Regular': require('../assets/font/static/Fustat-Regular.ttf'),
    'Fustat-Bold': require('../assets/font/static/Fustat-Bold.ttf'),
    'Fustat-Medium': require('../assets/font/static/Fustat-Medium.ttf'),
    'Fustat-Light': require('../assets/font/static/Fustat-Light.ttf'),
    'Fustat-ExtraBold': require('../assets/font/static/Fustat-ExtraBold.ttf'),
    'Fustat-ExtraLight': require('../assets/font/static/Fustat-ExtraLight.ttf'),
    'Fustat-SemiBold': require('../assets/font/static/Fustat-SemiBold.ttf'),
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
    <View style={styles.container} onLayout={onLayoutRootView}>
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
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Nutricionista" component={NutricionistaScreen} />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </PaperProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});