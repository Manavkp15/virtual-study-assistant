import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English locales
import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import studyPlanEN from './locales/en/studyPlan.json';
import learningEN from './locales/en/learning.json';
import practiceEN from './locales/en/practice.json';
import weaknessEN from './locales/en/weakness.json';
import revisionEN from './locales/en/revision.json';
import mockTestEN from './locales/en/mockTest.json';
import testsEN from './locales/en/tests.json';
import analyticsEN from './locales/en/analytics.json';
import mistakesEN from './locales/en/mistakes.json';
import aiEN from './locales/en/ai.json';
import authEN from './locales/en/auth.json';
import notificationsEN from './locales/en/notifications.json';
import adminEN from './locales/en/admin.json';

// Import Gujarati locales
import commonGU from './locales/gu/common.json';
import dashboardGU from './locales/gu/dashboard.json';
import studyPlanGU from './locales/gu/studyPlan.json';
import learningGU from './locales/gu/learning.json';
import practiceGU from './locales/gu/practice.json';
import weaknessGU from './locales/gu/weakness.json';
import revisionGU from './locales/gu/revision.json';
import mockTestGU from './locales/gu/mockTest.json';
import testsGU from './locales/gu/tests.json';
import analyticsGU from './locales/gu/analytics.json';
import mistakesGU from './locales/gu/mistakes.json';
import aiGU from './locales/gu/ai.json';
import authGU from './locales/gu/auth.json';
import notificationsGU from './locales/gu/notifications.json';
import adminGU from './locales/gu/admin.json';

const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    studyPlan: studyPlanEN,
    learning: learningEN,
    practice: practiceEN,
    weakness: weaknessEN,
    revision: revisionEN,
    mockTest: mockTestEN,
    tests: testsEN,
    analytics: analyticsEN,
    mistakes: mistakesEN,
    ai: aiEN,
    auth: authEN,
    notifications: notificationsEN,
    admin: adminEN
  },
  gu: {
    common: commonGU,
    dashboard: dashboardGU,
    studyPlan: studyPlanGU,
    learning: learningGU,
    practice: practiceGU,
    weakness: weaknessGU,
    revision: revisionGU,
    mockTest: mockTestGU,
    tests: testsGU,
    analytics: analyticsGU,
    mistakes: mistakesGU,
    ai: aiGU,
    auth: authGU,
    notifications: notificationsGU,
    admin: adminGU
  }
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'dashboard',
      'studyPlan',
      'learning',
      'practice',
      'weakness',
      'revision',
      'mockTest',
      'tests',
      'analytics',
      'mistakes',
      'ai',
      'auth',
      'notifications',
      'admin'
    ],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    }
  });

export default i18n;
