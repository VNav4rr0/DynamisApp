// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  pt: {
    // CORREÇÃO AQUI
    translation: require('../src/locales/pt.json'),
  },
  en: {
    // CORREÇÃO AQUI
    translation: require('../src/locales/en.json'),
  },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    // Remova o debug se não for mais necessário
  });

export default i18n; // <--- EXPORTAÇÃO DEFAULT AQUI!