import React, { useState, useEffect, useCallback } from 'react';
import '../src/i18n';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Imports do Firebase - Adicionados para o controle de autenticação
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig/firebase'; // <-- Verifique se o caminho para seu firebase.ts está correto

// Imports do React Native Paper
import { 
  MD3DarkTheme,
  Provider as PaperProvider 
} from 'react-native-paper';

// Imports das Telas (mantive todos os seus)
import BoasVindasScreen from '../src/screens/BoasVindasScreen';
import HomeScreen from '../src/screens/HomeScreen';
import ProgressoDetalhadoScreen from '../src/screens/ProgressoDetalhadoScreen';
import CadastroInicialScreen from '../src/screens/CadastroInicialScreen';
import DefinirMetasScreen from '../src/screens/DefinirMetasScreen';
import LoginScreen from '../src/screens/LoginScreen';
import PerfilScreen from '../src/screens/PerfilScreen';
import NutricionistaScreen from '../src/screens/NutricionistaScreen';
import RecuperarSenhaScreen from '../src/screens/RecuperarSenhaScreen';
import GerenciarInformacoesScreen from '../src/screens/GerenciarInformacoesScreen';

// Definição de tipo das telas para o navegador
export type RootStackParamList = {
  Home: undefined;
  ProgressoDetalhado: undefined;
  CadastroInicial: undefined;
  DefinirMetas: undefined;
  Login: undefined;
  RecuperarSenha: undefined;
  BoasVindas: undefined;
  Perfil: undefined;
  Nutricionista: undefined;
  GerenciarInformacoes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuração do Tema Customizado com as fontes (mantive o seu)
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

// --- Stacks de Navegação Separados ---

// Telas para quem NÃO está logado
function AuthStack() {
  return (
    <Stack.Navigator 
      initialRouteName="BoasVindas"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}
    >
      <Stack.Screen name="BoasVindas" component={BoasVindasScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
    </Stack.Navigator>
  );
}

// Telas para quem JÁ ESTÁ logado
function AppStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="DefinirMetas" component={DefinirMetasScreen} />
      <Stack.Screen name="ProgressoDetalhado" component={ProgressoDetalhadoScreen} />
      <Stack.Screen name="Perfil" component={PerfilScreen} />
      <Stack.Screen name="Nutricionista" component={NutricionistaScreen} />
      <Stack.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
    </Stack.Navigator>
  );
}

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

  // --- Lógica de Controle de Autenticação ---
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // "Escuta" as mudanças de estado de login/logout do Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
    });

    // Limpa a inscrição ao desmontar o componente para evitar vazamento de memória
    return unsubscribe;
  }, []); // O array de dependências vazio faz com que este efeito rode apenas uma vez

  const onLayoutRootView = useCallback(async () => {
    // Esconde a splash screen só quando as fontes e a verificação do usuário terminarem
    if ((fontsLoaded || fontError) && !initializing) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if (fontError) {
    console.error("Erro ao carregar fontes:", fontError);
  }

  // Enquanto as fontes ou a verificação do firebase estiverem carregando, a splash screen ficará ativa
  if (!fontsLoaded || initializing) {
    return null;
  }
  
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          {/* Renderiza o grupo de telas correto com base no estado do usuário */}
          {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
        {/* Mudei para "light" para que os ícones fiquem brancos no fundo escuro */}
        <StatusBar style="light" />
      </PaperProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});