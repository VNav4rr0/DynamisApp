import React, { useState, useEffect, useCallback } from 'react';
import './src/i18n'; // Verifique se o caminho está correto
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig/firebase'; // Caminho para firebase na raiz (ajuste conforme necessário)
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';

// Imports das Telas
import BoasVindasScreen from './screens/BoasVindasScreen';
import HomeScreen from './screens/HomeScreen';
import ProgressoDetalhadoScreen from './screens/ProgressoDetalhadoScreen';
import CadastroInicialScreen from './screens/CadastroInicialScreen';
import DefinirMetasScreen from './screens/DefinirMetasScreen';
import LoginScreen from './screens/LoginScreen';
import PerfilScreen from './screens/PerfilScreen';
import NutricionistaScreen from './screens/NutricionistaScreen';
import RecuperarSenhaScreen from './screens/RecuperarSenhaScreen';
import GerenciarInformacoesScreen from './screens/GerenciarInformacoesScreen';

// --- ARQUITETURA CORRIGIDA ---

// 1. Tipagem separada para cada navegador
export type AuthStackParamList = {
  BoasVindas: undefined;
  Login: undefined;
  RecuperarSenha: undefined;
  CadastroInicial: undefined;
  DefinirMetas: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  Perfil: undefined;
  Nutricionista: undefined;
  GerenciarInformacoes: undefined;
};

// 2. Criamos um Stack para cada fluxo, com a sua própria tipagem
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

// 3. Componentes de Navegador Separados
function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      initialRouteName="BoasVindas"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}
    >
      <AuthStack.Screen name="BoasVindas" component={BoasVindasScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen as React.ComponentType<any>} />
      <AuthStack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <AuthStack.Screen name="CadastroInicial" component={CadastroInicialScreen as React.ComponentType<any>} />
      <AuthStack.Screen name="DefinirMetas" component={DefinirMetasScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  // Se quiser usar abas aqui (o que seria o ideal), pode trocar createNativeStackNavigator por createBottomTabNavigator
  return (
    <AppStack.Navigator 
      initialRouteName="Home"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}
    >
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="ProgressoDetalhado" component={ProgressoDetalhadoScreen} />
      <AppStack.Screen name="Perfil" component={PerfilScreen} />
      <AppStack.Screen name="Nutricionista" component={NutricionistaScreen} />
      <AppStack.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
    </AppStack.Navigator>
  );
}

// Configuração do Tema (mantida)
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    outline: '#6ad400',
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

SplashScreen.preventAutoHideAsync();

// Componente Root foi renomeado para App para ser o default export
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Fustat-Regular': require('./assets/font/static/Fustat-Regular.ttf'),
    'Fustat-Bold': require('./assets/font/static/Fustat-Bold.ttf'),
    'Fustat-Medium': require('./assets/font/static/Fustat-Medium.ttf'),
    'Fustat-Light': require('./assets/font/static/Fustat-Light.ttf'),
    'Fustat-ExtraBold': require('./assets/font/static/Fustat-ExtraBold.ttf'),
    'Fustat-ExtraLight': require('./assets/font/static/Fustat-ExtraLight.ttf'),
    'Fustat-SemiBold': require('./assets/font/static/Fustat-SemiBold.ttf'),
  });

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, [initializing]);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && !initializing) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if (!fontsLoaded && !fontError && initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ad400" />
      </View>
    );
  }
  
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
        <StatusBar style="light" />
      </PaperProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  }
});
