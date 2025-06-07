

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';

// Definindo os idiomas disponíveis
const LANGUAGES = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  // Adicione outros idiomas aqui
];

const LanguageSwitcherDropdown = () => {
  const { i18n } = useTranslation();
  const [isMenuVisible, setMenuVisible] = useState(false);

  const onSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setMenuVisible(false); // Fecha o menu após a seleção
  };

  return (
    <View style={styles.wrapper}>
      {/* Botão que abre/fecha o menu */}
      <TouchableOpacity 
        style={styles.triggerButton} 
        onPress={() => setMenuVisible(!isMenuVisible)}
      >
        <Icon source="web" size={24} color="#000" />
      </TouchableOpacity>

      {/* O menu dropdown, que só aparece se isMenuVisible for true */}
      {isMenuVisible && (
        <View style={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.dropdownItem}
              onPress={() => onSelectLanguage(lang.code)}
            >
              <Icon source="web" size={20} color="#FFF" />
              <Text style={styles.dropdownItemText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative', // Necessário para o posicionamento absoluto do dropdown
    zIndex: 1, // Garante que o menu apareça sobre outros elementos
  },
  triggerButton: {
    width: 48,
    height: 48,
    borderRadius: 24, // 50% de width/height para ser um círculo perfeito
    backgroundColor: '#6ad400', // Cor verde
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 56, // Distância do topo do botão (48 de altura + 8 de margem)
    right: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.9)', // Fundo escuro semitransparente
    borderRadius: 8,
    padding: 8,
    width: 150, // Largura do menu
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontFamily: 'Fustat-Medium',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default LanguageSwitcherDropdown;