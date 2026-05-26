import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'de', 'ja', 'it', 'pt-BR', 'ko', 'zh', 'ru', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  it: 'Italiano',
  'pt-BR': 'Português (Brasil)',
  ko: '한국어',
  zh: '简体中文',
  ru: 'Русский',
  hi: 'हिन्दी',
};
