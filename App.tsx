import React, { useState, useEffect, useCallback } from 'react';
import './src/i18n';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig/firebase';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';

// Telas
import BoasVindasScreen from './src/screens/BoasVindasScreen';
import LoginScreen from './src/screens/LoginScreen';
import RecuperarSenhaScreen from './src/screens/RecuperarSenhaScreen';
import CadastroInicialScreen from './src/screens/CadastroInicialScreen';
import DefinirMetasScreen from './src/screens/DefinirMetasScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProgressoDetalhadoScreen from './src/screens/ProgressoDetalhadoScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import NutricionistaScreen from './src/screens/NutricionistaScreen';
import GerenciarInformacoesScreen from './src/screens/GerenciarInformacoesScreen';

// Tipagem
export type AuthStackParamList = {
  BoasVindas: undefined;
  Login: undefined;
  CadastroInicial: undefined;
  RecuperarSenha: undefined;
  DefinirMetas: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  Perfil: undefined;
  Nutricionista: undefined;
  GerenciarInformacoes: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="BoasVindas" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="BoasVindas" component={BoasVindasScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
      <AuthStack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <AuthStack.Screen name="DefinirMetas" component={DefinirMetasScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="ProgressoDetalhado" component={ProgressoDetalhadoScreen} />
      <AppStack.Screen name="Perfil" component={PerfilScreen} />
      <AppStack.Screen name="Nutricionista" component={NutricionistaScreen} />
      <AppStack.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
    </AppStack.Navigator>
  );
}

// Tema
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
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'Fustat-Medium',
      fontWeight: 'normal' as const,
    },
    bold: {
      fontFamily: 'Fustat-Bold',
      fontWeight: 'normal' as const,
    },
  },
};

// Mantém Splash até carregar tudo
SplashScreen.preventAutoHideAsync();

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
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && !initializing) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if (!fontsLoaded && !fontError) {
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
    backgroundColor: '#000',
  },
});
