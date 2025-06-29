import React, { useState, useEffect, useCallback } from 'react';
import './src/i18n'; // Mantenha sua importação i18n
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // NOVO: Importar BottomTabNavigator
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig/firebase';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons'; // Para os ícones da TabBar (se CustomTabBar não usar)

// Telas
import BoasVindasScreen from './src/screens/BoasVindasScreen';
import LoginScreen from './src/screens/LoginScreen';
import RecuperarSenhaScreen from './src/screens/RecuperarSenhaScreen';
import CadastroInicialScreen from './src/screens/CadastroInicialScreen';
import DefinirMetasScreen from './src/screens/DefinirMetasScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProgressoDetalhadoScreen from './src/screens/ProgressoDetalhadoScreen';
import PerfilScreen from './src/screens/PerfilScreen'; // Note: Renomeei ProfileScreenFinal para PerfilScreen aqui
import NutricionistaScreen from './src/screens/NutricionistaScreen';
import GerenciarInformacoesScreen from './src/screens/GerenciarInformacoesScreen';

// Componente da TabBar Customizada
import CustomTabBar from './src/components/CustomTabBar'; // NOVO: Importar seu CustomTabBar

const { width } = Dimensions.get('window');

// Tipagem - Ajuste os nomes das rotas para as abas
export type AuthStackParamList = {
    BoasVindas: undefined;
    Login: undefined;
    CadastroInicial: undefined;
    RecuperarSenha: undefined;
    DefinirMetas: undefined;
};

// Tipagem para o BottomTabNavigator
export type MainTabParamList = {
    HomeTab: undefined; // Nome da aba para Home
    ProgressoDetalhadoTab: undefined; // Nome da aba para Progresso Detalhado
    PerfilTab: undefined; // Nome da aba para Perfil
};

// Tipagem para o AppStack (que contém o MainTabNavigator e outras telas)
export type AppStackParamList = {
    MainTabs: undefined; // Ponto de entrada para o BottomTabNavigator
    Nutricionista: undefined;
    GerenciarInformacoes: undefined;
    // ... quaisquer outras telas que não são abas mas são acessíveis no fluxo autenticado
};


const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStackNavigator = createNativeStackNavigator<AppStackParamList>(); // Renomeado para evitar conflito com AppStack
const MainTab = createBottomTabNavigator<MainTabParamList>(); // NOVO: Instanciar BottomTabNavigator

// Componente do Tab Navigator Principal (contém as abas com a navbar)
function MainTabNavigator() {
    return (
        <MainTab.Navigator
            screenOptions={{
                headerShown: false, // Oculta o cabeçalho padrão da tela
            }}
            tabBar={(props) => <CustomTabBar {...props} />} // Usa seu componente customizado de TabBar
            initialRouteName="PerfilTab" // Defina a aba inicial
        >
            <MainTab.Screen name="HomeTab" component={HomeScreen} />
            <MainTab.Screen name="ProgressoDetalhadoTab" component={ProgressoDetalhadoScreen} />
            <MainTab.Screen name="PerfilTab" component={PerfilScreen} />
        </MainTab.Navigator>
    );
}

// Navegador para o fluxo de Autenticação (telas públicas)
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

// Navegador principal do aplicativo (após autenticação)
function AppFlowNavigator() {
    return (
        <AppStackNavigator.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
            {/* O MainTabs é o seu BottomTabNavigator */}
            <AppStackNavigator.Screen name="MainTabs" component={MainTabNavigator} />
            {/* Outras telas que não são abas, mas fazem parte do fluxo autenticado */}
            <AppStackNavigator.Screen name="Nutricionista" component={NutricionistaScreen} />
            <AppStackNavigator.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
        </AppStackNavigator.Navigator>
    );
}

// Tema para React Native Paper
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
        // Certifique-se de que todos os pesos de fonte que você carrega estão aqui
        light: {
            fontFamily: 'Fustat-Light',
            fontWeight: 'normal' as const,
        },
        extraBold: {
            fontFamily: 'Fustat-ExtraBold',
            fontWeight: 'normal' as const,
        },
        extraLight: {
            fontFamily: 'Fustat-ExtraLight',
            fontWeight: 'normal' as const,
        },
        semiBold: {
            fontFamily: 'Fustat-SemiBold',
            fontWeight: 'normal' as const,
        },
    },
};

// Mantém Splash até carregar tudo
SplashScreen.preventAutoHideAsync();

export default function App() {
    // Carregamento de fontes
    const [fontsLoaded, fontError] = useFonts({
        'Fustat-Regular': require('./assets/font/static/Fustat-Regular.ttf'),
        'Fustat-Bold': require('./assets/font/static/Fustat-Bold.ttf'),
        'Fustat-Medium': require('./assets/font/static/Fustat-Medium.ttf'),
        'Fustat-Light': require('./assets/font/static/Fustat-Light.ttf'),
        'Fustat-ExtraBold': require('./assets/font/static/Fustat-ExtraBold.ttf'),
        'Fustat-ExtraLight': require('./assets/font/static/Fustat-ExtraLight.ttf'),
        'Fustat-SemiBold': require('./assets/font/static/Fustat-SemiBold.ttf'),
    });

    // Estado de autenticação
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // Listener para o estado de autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser); // Define o usuário logado (ou null)
            setInitializing(false); // Marca a inicialização da autenticação como completa
        });
        return unsubscribe; // Limpa o listener ao desmontar
    }, []);

    // Esconde a Splash Screen quando fontes e autenticação estiverem prontos
    const onLayoutRootView = useCallback(async () => {
        if ((fontsLoaded || fontError) && !initializing) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError, initializing]);

    // Tela de carregamento/splash durante o carregamento de fontes ou inicialização da autenticação
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
                    {/* Condicionalmente renderiza o fluxo do app ou de autenticação */}
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