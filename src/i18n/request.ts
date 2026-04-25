// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

async function detectBrowserLocale(): Promise<string> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';
    const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0] || '';
    
    const supportedLocales = ['ru', 'pl', 'en', 'de'];
    
    if (supportedLocales.includes(preferredLocale)) {
      return preferredLocale;
    }
  } catch (error) {
    console.error('Error detecting browser locale:', error);
  }
  
  return 'ru';
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  
  let locale = cookieStore.get('locale')?.value;
  
  if (!locale) {
    locale = await detectBrowserLocale();
  }
  
  const validLocales = ['ru', 'pl', 'en', 'de'];
  if (!validLocales.includes(locale)) {
    locale = 'ru';
  }
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});