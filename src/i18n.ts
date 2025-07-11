// src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Importe seus arquivos JSON de tradução
import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';

// Verifique se i18n já está inicializado antes de tentar inicializar novamente
if (!i18n.isInitialized) { // Adiciona esta verificação
  const resources = {
    pt: ptTranslations,
    en: enTranslations,
  };

  i18n
    .use(initReactI18next)
    .init({
      debug: true,
      compatibilityJSON: 'v4', // Ou 'v3' se o erro do pluralizer incomodar muito
      resources,

      lng: Localization.getLocales()?.[0]?.languageCode ?? 'pt',
      fallbackLng: 'pt',

      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      ns: ['translation'], // Namespaces que você está usando
      defaultNS: 'translation',
    });
} else {
  console.warn("i18n já está inicializado. Pulando init redundante."); // Log para depuração
}

export default i18n; 