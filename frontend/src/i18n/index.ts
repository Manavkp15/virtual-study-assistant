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
import homeworkEN from './locales/en/homework.json';
import studyMaterialsEN from './locales/en/studyMaterials.json';

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
import homeworkGU from './locales/gu/homework.json';
import studyMaterialsGU from './locales/gu/studyMaterials.json';

// Import Hindi locales
import commonHI from './locales/hi/common.json';
import dashboardHI from './locales/hi/dashboard.json';
import studyPlanHI from './locales/hi/studyPlan.json';
import learningHI from './locales/hi/learning.json';
import practiceHI from './locales/hi/practice.json';
import weaknessHI from './locales/hi/weakness.json';
import revisionHI from './locales/hi/revision.json';
import mockTestHI from './locales/hi/mockTest.json';
import testsHI from './locales/hi/tests.json';
import analyticsHI from './locales/hi/analytics.json';
import mistakesHI from './locales/hi/mistakes.json';
import aiHI from './locales/hi/ai.json';
import authHI from './locales/hi/auth.json';
import notificationsHI from './locales/hi/notifications.json';
import adminHI from './locales/hi/admin.json';
import homeworkHI from './locales/hi/homework.json';
import studyMaterialsHI from './locales/hi/studyMaterials.json';

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
    admin: adminEN,
    homework: homeworkEN,
    studyMaterials: studyMaterialsEN
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
    admin: adminGU,
    homework: homeworkGU,
    studyMaterials: studyMaterialsGU
  },
  hi: {
    common: commonHI,
    dashboard: dashboardHI,
    studyPlan: studyPlanHI,
    learning: learningHI,
    practice: practiceHI,
    weakness: weaknessHI,
    revision: revisionHI,
    mockTest: mockTestHI,
    tests: testsHI,
    analytics: analyticsHI,
    mistakes: mistakesHI,
    ai: aiHI,
    auth: authHI,
    notifications: notificationsHI,
    admin: adminHI,
    homework: homeworkHI,
    studyMaterials: studyMaterialsHI
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
      'admin',
      'homework',
      'studyMaterials'
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
