import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './resources/en';
import { id } from './resources/id';

/**
 * i18next is initialized once at module load. The active language is driven by
 * the persisted `settings.lang` via `i18n.changeLanguage` in the PlanStore.
 */
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
