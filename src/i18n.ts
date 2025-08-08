// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Recursos de tradução
const resources = {
  pt: {
    translation: require('./locales/pt.json'),
  },
  en: {
    translation: require('./locales/en.json'),
  },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'pt',
    fallbackLng: 'pt',
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;