import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: 'es',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes text
})

// Keeps <html lang> in sync so screen readers pronounce the page correctly.
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

export default i18n
