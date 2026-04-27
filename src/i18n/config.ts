// src/i18n/config.ts
export const locales = ['uk', 'pl', 'en', 'de'] as const
export const defaultLocale = 'ru'

export type Locale = typeof locales[number]

export const localeNames: Record<Locale, string> = {
  uk: 'Українська',
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch'
}

export const localeFlags: Record<Locale, string> = {
  uk: '🇺🇦',
  pl: '🇵🇱',
  en: '🇬🇧',
  de: '🇩🇪'
}