// src/screens/BoasVindasScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    StatusBar,
    Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

type BoasVindasScreenProps = NativeStackScreenProps<AuthStackParamList, 'BoasVindas'>;

const BoasVindasScreen: React.FC<BoasVindasScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <StatusBar  />
            <ImageBackground
                source={require('../../assets/background_login.png')}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>
                            {t('welcome.title')}
                        </Text>
                        <TouchableOpacity
                            style={styles.buttonLogin}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.buttonTextLogin}>
                                {t('welcome.loginButton')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.buttonRegister}
                            onPress={() => navigation.navigate('CadastroInicial')}
                        >
                            <Text style={styles.buttonTextRegister}>
                                {t('welcome.registerButton')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 50,
    },
    content: {
        width: '80%',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'Fustat-Bold',
    },
    buttonLogin: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        backgroundColor: '#AEF359',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonTextLogin: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
        fontFamily: 'Fustat-Bold',
    },
    buttonRegister: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#AEF359',
        alignItems: 'center',
    },
    buttonTextRegister: {
        fontSize: 18,
        color: '#AEF359',
        fontWeight: 'bold',
        fontFamily: 'Fustat-Bold',
    },
});

export default BoasVindasScreen;