// App.tsx CORRIGIDO
import React, { useState, useEffect, useCallback } from 'react';
import './src/i18n';
import { View, StyleSheet, ActivityIndicator, Dimensions, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig/firebase';
import { AuthStackParamList, MainTabParamList, AppStackParamList } from './src/navigation/types'; // <-- IMPORTE DAQUI


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

// Componente da TabBar Customizada
import CustomTabBar from './src/components/CustomTabBar';

// Suprimir o aviso de "Text strings" (mantenha ativo por enquanto)
LogBox.ignoreLogs(['Warning: Text strings must be rendered within a <Text> component.']);


const { width } = Dimensions.get('window');

// Tipagem



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
                title: '',
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
            initialRouteName="PerfilTab"
        >
            <MainTab.Screen 
                name="HomeTab" 
                component={HomeScreen} 
                options={{ 
                    tabBarLabel: '',
                    tabBarAccessibilityLabel: 'Home',
                }}
            />
            <MainTab.Screen 
                name="ProgressoDetalhadoTab" 
                component={ProgressoDetalhadoScreen} 
                options={{ 
                    tabBarLabel: '',
                    tabBarAccessibilityLabel: 'Progresso Detalhado',
                }}
            />
            <MainTab.Screen 
                name="PerfilTab" 
                component={PerfilScreen} 
                options={{ 
                    tabBarLabel: '',
                    tabBarAccessibilityLabel: 'Perfil',
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
            <AuthStack.Screen name="NutricionistaAccess" component={NutricionistaAccessScreen} />
            {/* // <-- MUDANÇA 2: TELA ADICIONADA A ESTE NAVEGADOR */}
            <AuthStack.Screen name="Nutricionista" component={NutricionistaScreen} /> 
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
            {/* // <-- MUDANÇA 2: TELA REMOVIDA DESTE NAVEGADOR */}
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

SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded, fontError] = useFonts(FONT_ASSETS); 

    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setInitializing(false);
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
                {user ? <AppFlowNavigator /> : <AuthNavigator />}
            </NavigationContainer>
            <StatusBar style="light" />
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