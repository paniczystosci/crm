// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

// Динамические мета-теги для языков
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value || 'ru'
  
  const titles: Record<string, string> = {
    ru: 'CRM Cleaning Company | Управление клининговой компанией',
    pl: 'CRM Cleaning Company | Zarządzanie firmą sprzątającą',
    en: 'CRM Cleaning Company | Cleaning Company Management',
    de: 'CRM Cleaning Company | Reinigungsunternehmensverwaltung',
  }
  
  const descriptions: Record<string, string> = {
    ru: 'Профессиональная CRM система для управления клининговой компанией. Заказы, клинеры, выплаты, статистика.',
    pl: 'Profesjonalny system CRM do zarządzania firmą sprzątającą. Zamówienia, sprzątacze, płatności, statystyki.',
    en: 'Professional CRM system for cleaning company management. Orders, cleaners, payments, statistics.',
    de: 'Professionelles CRM-System für die Verwaltung von Reinigungsunternehmen. Aufträge, Reinigungskräfte, Zahlungen, Statistiken.',
  }
  
  return {
    title: titles[locale] || titles.ru,
    description: descriptions[locale] || descriptions.ru,
    icons: {
      icon: '/favicon.ico',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  let locale = cookieStore.get('locale')?.value || 'ru'
  
  // Валидация локали (без notFound)
  const validLocales = ['ru', 'pl', 'en', 'de']
  if (!validLocales.includes(locale)) {
    locale = 'ru'
  }
  
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}