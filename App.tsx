// App.tsx
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
// import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
// import { MaterialIcons } from '@expo/vector-icons'; // Manter importado

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
import CustomTabBar from './src/components/CustomTabBar'; // <--- VERIFIQUE ESTE CAMINHO!

const { width } = Dimensions.get('window');

// Tipagem
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

// Navegadores
function MainTabNavigator() {
    return (
        <MainTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarLabel: () => null,
                title: '', // Certifica que o título padrão da tela é vazio
                headerTitle: () => null, 
                headerTintColor: 'transparent', // Se alguma cor estiver sendo usada para string
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
            initialRouteName="PerfilTab"
        >
            {/* Opções de tela - Defina explicitamente propriedades de texto como vazio ou null */}
            <MainTab.Screen 
                name="HomeTab" 
                component={HomeScreen} 
                options={{ 
                    title: '', 
                    tabBarLabel: '', 
                    tabBarAccessibilityLabel: 'Home', 
                    headerTitle: () => null, 
                    headerTintColor: 'transparent',
                }}
            />
            <MainTab.Screen 
                name="ProgressoDetalhadoTab" 
                component={ProgressoDetalhadoScreen} 
                options={{ 
                    title: '',
                    tabBarLabel: '', 
                    tabBarAccessibilityLabel: 'Progresso Detalhado',
                    headerTitle: () => null,
                    headerTintColor: 'transparent',
                }}
            />
            <MainTab.Screen 
                name="PerfilTab" 
                component={PerfilScreen} 
                options={{ 
                    title: '',
                    tabBarLabel: '', 
                    tabBarAccessibilityLabel: 'Perfil',
                    headerTitle: () => null,
                    headerTintColor: 'transparent',
                }}
            />
        </MainTab.Navigator>
    );
}

function AuthNavigator() {
    return (
        <AuthStack.Navigator 
            initialRouteName="BoasVindas" 
            screenOptions={{ 
                headerShown: false,
                title: '', 
                headerTitle: () => null,
                headerBackTitle: '',
                headerBackTitleVisible: false,
                headerTintColor: 'transparent',
            }}
        >
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
        <AppStackNavigator.Navigator 
            screenOptions={{ 
                headerShown: false, 
                contentStyle: { backgroundColor: '#000000' },
                title: '', 
                headerTitle: () => null,
                headerBackTitle: '',
                headerBackTitleVisible: false,
                headerTintColor: 'transparent',
            }}
        >
            <AppStackNavigator.Screen 
                name="MainTabs" 
                component={MainTabNavigator} 
                options={{ 
                    title: '',
                    headerTitle: () => null,
                    headerBackTitle: '',
                }}
            />
            <AppStackNavigator.Screen 
                name="Nutricionista" 
                component={NutricionistaScreen} 
                options={{ 
                    title: '', 
                    headerTitle: () => null,
                    headerBackTitle: '',
                }}
            />
            <AppStackNavigator.Screen 
                name="GerenciarInformacoes" 
                component={GerenciarInformacoesScreen} 
                options={{ 
                    title: '', 
                    headerTitle: () => null,
                    headerBackTitle: '',
                }}
            />
        </AppStackNavigator.Navigator>
    );
}

const FONT_ASSETS = {
    'Fustat-Regular': require('./assets/font/static/Fustat-Regular.ttf'),
    'Fustat-Bold': require('./assets/font/static/Fustat-Bold.ttf'),
    'Fustat-Medium': require('./assets/font/static/Fustat-Medium.ttf'),
    'Fustat-Light': require('./assets/font/static/Fustat-Light.ttf'),
    'Fustat-ExtraBold': require('./assets/font/static/Fustat-ExtraBold.ttf'),
    'Fustat-ExtraLight': require('./assets/font/static/Fustat-ExtraLight.ttf'),
    'Fustat-SemiBold': require('./assets/font/static/Fustat-SemiBold.ttf'),
};

// COMENTE SplashScreen.preventAutoHideAsync() para depurar a splash
// SplashScreen.preventAutoHideAsync(); 

export default function App() {
    const [fontsLoaded, fontError] = useFonts(FONT_ASSETS); 

    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        console.log("App.tsx: onAuthStateChanged listener ativado.");
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setInitializing(false);
            console.log("App.tsx: Estado de autenticação definido. User:", authUser ? authUser.uid : "null", "Initializing:", false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        async function prepareApp() {
            try {
                if ((fontsLoaded || fontError) && !initializing) {
                    console.log("App.tsx (PrepareApp): Fontes carregadas E Auth inicializada. Tentando esconder SplashScreen.");
                    await SplashScreen.hideAsync(); 
                    console.log("App.tsx (PrepareApp): Condição satisfeita para renderizar conteúdo.");
                } else {
                    console.log("App.tsx (PrepareApp): Condições para renderizar conteúdo AINDA NÃO satisfeitas.");
                    console.log(`  F: ${String(fontsLoaded)}, E: ${String(fontError)}, I: ${String(initializing)}`);
                }
            } catch (e) {
                console.warn("App.tsx (PrepareApp): Erro ao esconder SplashScreen:", e);
            }
        }
        prepareApp();
    }, [fontsLoaded, fontError, initializing]);

    if (!fontsLoaded && !fontError || initializing) {
        console.log("App.tsx: Exibindo tela de carregamento. F:", fontsLoaded, "E:", fontError, "I:", initializing);
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6ad400" />
                <Text style={{ color: 'white', marginTop: 10 }}>Carregando Fontes/Autenticação...</Text>
                <Text style={{ color: 'white', fontSize: 10 }}>F: {String(fontsLoaded)}, E: {String(fontError)}, I: {String(initializing)}</Text>
            </View>
        );
    }

    console.log("App.tsx: Renderizando Conteúdo Principal. User:", user ? user.uid : "null");
    return (
        <View style={styles.container}>
            {/* Removi o PaperProvider temporariamente nas versões anteriores, reintroduza-o se necessário */}
            {/* <PaperProvider theme={theme}> */}
                <NavigationContainer>
                    {user ? <AppFlowNavigator /> : <AuthNavigator />}
                </NavigationContainer>
                <StatusBar style="light" />
            {/* </PaperProvider> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});