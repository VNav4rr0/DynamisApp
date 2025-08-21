import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Componente para exibir os idiomas disponíveis no dropdown
const LanguageOption: React.FC<{
  label: string;
  onPress: () => void;
}> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.optionButton} onPress={onPress}>
    <Text style={styles.optionText}>{label}</Text>
  </TouchableOpacity>
);

const LanguageSwitcherDropdown: React.FC = () => {
  const { i18n } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false); // NOVO ESTADO para o dropdown

  const currentLanguage = i18n.language;

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setDropdownVisible(false); // Fechar o dropdown após a seleção
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleDropdown} style={styles.button}>
        <Text style={styles.buttonText}>{currentLanguage.toUpperCase()}</Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#FFF" />
      </TouchableOpacity>

      {dropdownVisible && ( // Renderização condicional para o dropdown
        <View style={styles.dropdownMenu}>
          <LanguageOption label="Português" onPress={() => changeLanguage('pt')} />
          <View style={styles.divider} />
          <LanguageOption label="English" onPress={() => changeLanguage('en')} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40, // Posição abaixo do botão
    right: 0,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 10,
    minWidth: 150,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#424242',
    marginVertical: 5,
  },
});

export default LanguageSwitcherDropdown;