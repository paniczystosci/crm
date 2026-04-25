// src/i18n/config.ts
export const locales = ['ru', 'pl', 'en', 'de'] as const
export const defaultLocale = 'ru'

export type Locale = typeof locales[number]

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch'
}

export const localeFlags: Record<Locale, string> = {
  ru: '🇷🇺',
  pl: '🇵🇱',
  en: '🇬🇧',
  de: '🇩🇪'
}