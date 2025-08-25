import React, { useState, useEffect } from 'react';
import './src/i18n';
import { View, StyleSheet, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig/firebase';

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
import NutricionistaAccessScreen from './src/screens/NutricionistaAccessScreen';
import CustomTabBar from './src/components/CustomTabBar';

LogBox.ignoreLogs(['Warning: Text strings must be rendered within a <Text> component.']);

// Tipagem
export type AuthStackParamList = {
    BoasVindas: undefined;
    Login: undefined;
    CadastroInicial: undefined;
    RecuperarSenha: undefined;
    DefinirMetas: undefined;
    NutricionistaAccess: undefined;
};
export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};
export type AppStackParamList = {
    MainTabs: undefined;
    Nutricionista: { clientUid: string; clientName: string; };
    GerenciarInformacoes: undefined;
};

// Definição dos Stacks
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStackNavigator = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Navegadores
function MainTabNavigator() {
    return (
        <MainTab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <MainTab.Screen name="HomeTab" component={HomeScreen} />
            <MainTab.Screen name="ProgressoDetalhadoTab" component={ProgressoDetalhadoScreen} />
            <MainTab.Screen name="PerfilTab" component={PerfilScreen} />
        </MainTab.Navigator>
    );
}

// Navegador de Autenticação - Passa a função para criar uma sessão de cliente
function AuthNavigator({ setClientSession }: { setClientSession: (session: { clientUid: string; clientName: string; }) => void }) {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="BoasVindas" component={BoasVindasScreen} />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="CadastroInicial" component={CadastroInicialScreen} />
            <AuthStack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
            <AuthStack.Screen name="DefinirMetas" component={DefinirMetasScreen} />
            <AuthStack.Screen name="NutricionistaAccess">
                {(props) => <NutricionistaAccessScreen {...props} setClientSession={setClientSession} />}
            </AuthStack.Screen>
        </AuthStack.Navigator>
    );
}

// Navegador Principal - Decide a rota inicial com base na existência de uma sessão de cliente
function AppFlowNavigator({ clientSession, onLogout }: { 
    clientSession: { clientUid: string; clientName: string; } | null;
    onLogout: () => void;
}) {
    return (
        <AppStackNavigator.Navigator
            initialRouteName={clientSession ? 'Nutricionista' : 'MainTabs'}
            screenOptions={{ headerShown: false }}
        >
            <AppStackNavigator.Screen name="MainTabs" component={MainTabNavigator} />
            <AppStackNavigator.Screen
                name="Nutricionista"
                children={(props) => <NutricionistaScreen {...props} onLogout={onLogout} />}
                initialParams={clientSession ?? undefined}
            />
            <AppStackNavigator.Screen name="GerenciarInformacoes" component={GerenciarInformacoesScreen} />
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

SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [clientSession, setClientSession] = useState<{ clientUid: string; clientName: string; } | null>(null);

    const clearClientSession = () => {
        setClientSession(null);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (initializing) {
                setInitializing(false);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError || initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6ad400" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <NavigationContainer>
                {user || clientSession ? (
                    <AppFlowNavigator clientSession={clientSession} onLogout={clearClientSession} />
                ) : (
                    <AuthNavigator setClientSession={setClientSession} />
                )}
            </NavigationContainer>
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});