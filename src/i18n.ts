// src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Agora podemos usar 'import' com segurança, pois configuramos o TypeScript
import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';

const resources = {
  pt: ptTranslations,
  en: enTranslations,
};

i18n
  .use(initReactI18next)
  .init({
    // Propriedades de configuração que já confirmamos
    debug: true,
    compatibilityJSON: 'v4', 
    resources, // Nossas traduções importadas

    // Lógica segura para detecção de idioma
    lng: Localization.getLocales()?.[0]?.languageCode ?? 'pt',
    fallbackLng: 'pt',
    
    // Configurações padrão para React
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;