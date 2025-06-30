import React, { useState, useEffect, useCallback } from 'react';
import './src/i18n';
import { View, StyleSheet, ActivityIndicator, Dimensions, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Componente da TabBar Customizada
import CustomTabBar from './src/components/CustomTabBar';

const { width } = Dimensions.get('window');

export type AuthStackParamList = {
  BoasVindas: undefined;
  Login: undefined;
  CadastroInicial: undefined;
  RecuperarSenha: undefined;
  DefinirMetas: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ProgressoDetalhadoTab: undefined;
  PerfilTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Nutricionista: undefined;
  GerenciarInformacoes: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStackNavigator = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="PerfilTab"
    >
      <MainTab.Screen name="HomeTab" component={HomeScreen} />
      <MainTab.Screen name="ProgressoDetalhadoTab" component={ProgressoDetalhadoScreen} />
      <MainTab.Screen name="PerfilTab" component={PerfilScreen} />
    </MainTab.Navigator>
  );
}

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

function AppFlowNavigator() {
  return (
    <AppStackNavigator.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <AppStackNavigator.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStackNavigator.Screen name="Nutricionista" component={NutricionistaScreen} />
      <AppStackNavigator.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
    </AppStackNavigator.Navigator>
  );
}

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    outline: '#6ad400',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: { fontFamily: 'Fustat-Regular', fontWeight: 'normal' as const },
    medium: { fontFamily: 'Fustat-Medium', fontWeight: 'normal' as const },
    bold: { fontFamily: 'Fustat-Bold', fontWeight: 'normal' as const },
    light: { fontFamily: 'Fustat-Light', fontWeight: 'normal' as const },
    extraBold: { fontFamily: 'Fustat-ExtraBold', fontWeight: 'normal' as const },
    extraLight: { fontFamily: 'Fustat-ExtraLight', fontWeight: 'normal' as const },
    semiBold: { fontFamily: 'Fustat-SemiBold', fontWeight: 'normal' as const },
  },
};

// Evita o auto hide da splash
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
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setInitializing(false);
      console.log('onAuthStateChanged -> user:', authUser?.uid ?? 'null');
    });
    return unsubscribe;
  }, []);

  // ✅ Garante que a splash será escondida assim que tudo estiver pronto
  useEffect(() => {
    if ((fontsLoaded || fontError) && !initializing) {
      (async () => {
        console.log('useEffect: escondendo SplashScreen');
        await SplashScreen.hideAsync();
      })();
    }
  }, [fontsLoaded, fontError, initializing]);

  const onLayoutRootView = useCallback(async () => {
    console.log('onLayoutRootView disparado');
    if ((fontsLoaded || fontError) && !initializing) {
      console.log('Escondendo SplashScreen no onLayout');
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if (!fontsLoaded && !fontError || initializing) {
    return (
      <View style={styles.loadingContainer} onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color="#6ad400" />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          {user ? <AppFlowNavigator /> : <AuthNavigator />}
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
