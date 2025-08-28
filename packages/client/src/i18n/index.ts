import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enUS from './locales/en-US.json'
import ptBR from './locales/pt-BR.json'
import esES from './locales/es-ES.json'

const resources = {
  'en-US': {
    translation: enUS
  },
  'pt-BR': {
    translation: ptBR
  },
  'es-ES': {
    translation: esES
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  })

export default i18n
