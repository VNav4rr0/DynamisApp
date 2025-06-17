import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Button } from 'react-native-paper';
import { useTranslation, Trans } from 'react-i18next';
import LanguageSwitcherDropdown from '../components/LanguageSwitcherDropdown';

type BoasVindasScreenProps = NativeStackScreenProps<RootStackParamList, 'BoasVindas'>;

const BoasVindasScreen: React.FC<BoasVindasScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <ImageBackground source={require('../../assets/background.png')} style={styles.container}>
      
      <View style={styles.header}>
        
        
        <LanguageSwitcherDropdown />
      </View>
      
      <View style={styles.mainContent}>
        <Image
          source={require('../../assets/Logotipo.png')}
          style={styles.logoIcon}
          resizeMode="contain"
        />
        <Trans
          i18nKey="welcome.title"
          parent={Text}
          components={{
            highlight: <Text style={styles.titleHighlight} />,
          }}
          style={styles.title}
        />
      </View>

      <View style={styles.bottomButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          buttonColor="#6ad400"
          textColor="#020003"
          style={styles.buttonStyle}
          labelStyle={styles.buttonLabel}
        >
          {t('welcome.loginButton')}
        </Button>
        
        <Button
          mode="contained" 
          onPress={() => navigation.navigate('CadastroInicial')}
          buttonColor="transparent"

          textColor="#6ad400"
          style={styles.buttonStyle}
          labelStyle={styles.buttonLabel}
        >
          {t('welcome.registerButton')}
        </Button>
      </View>
    </ImageBackground>
  );
};

// ✅ ESTILOS ATUALIZADOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 72,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  logoIcon: { // Estilo apenas para o ícone do logo
    width: 180,
    height: 50,
  },
  mainContent: {
    flex: 1,
    
  },
  title: {
    fontFamily: 'Fustat-ExtraBold',
    fontSize: 38,
    lineHeight: 44,
    color: '#6ad400',

  },
  titleHighlight: {
    fontFamily: 'Fustat-ExtraBold',
    color: '#6ad400',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  buttonStyle: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#6ad400', // Borda verde para ambos, para dar um acabamento
  },
  buttonLabel: {
    fontFamily: 'Fustat-Bold',
    fontSize: 16,
    paddingVertical: 8,
  },
});

export default BoasVindasScreen;