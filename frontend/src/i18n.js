import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

// localStorage can throw (private mode, blocked storage): fall back to Spanish.
function savedLanguage() {
  try {
    return localStorage.getItem('language') ?? 'es'
  } catch {
    return 'es'
  }
}

// Keeps <html lang> in sync and remembers the choice for the next visit.
// Registered before init so the initial language also triggers it.
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  try {
    localStorage.setItem('language', language)
  } catch {
    // Not saved, but the app keeps working in the chosen language.
  }
})

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes text
})

export default i18n
