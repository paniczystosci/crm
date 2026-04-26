// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value || 'ru'
  
  const titles: Record<string, string> = {
    ru: 'CRM Cleaning Company | Управление клининговой компанией',
    pl: 'CRM Cleaning Company | Zarządzanie firmą sprzątającą',
    en: 'CRM Cleaning Company | Cleaning Company Management',
    de: 'CRM Cleaning Company | Reinigungsunternehmensverwaltung',
  }
  
  return {
    title: titles[locale] || titles.ru,
    description: 'Professional CRM system for cleaning company management',
    icons: {
      icon: '/favicon.ico',
      apple: '/logo.png', // Используем logo.png вместо отсутствующих иконок
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'CRM Cleaning',
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#10b981',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  let locale = cookieStore.get('locale')?.value || 'ru'
  
  const validLocales = ['ru', 'pl', 'en', 'de']
  if (!validLocales.includes(locale)) {
    locale = 'ru'
  }
  
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-startup-image" href="/logo.png" />
        
        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CRM Cleaning" />
        
        {/* Android Meta Tags */}
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="android-manifest" content="/manifest.json" />
        
        {/* Additional PWA Meta Tags */}
        <meta name="application-name" content="CRM Cleaning" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://your-supabase-project.supabase.co" />
        <link rel="dns-prefetch" href="https://your-supabase-project.supabase.co" />
        
        {/* Защита от скроллинга в PWA на Android */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Предотвращаем оверскролл на Android */
            body {
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Улучшаем таргетинг на мобильных устройствах */
            button, a {
              cursor: pointer;
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Плавные скроллы */
            html {
              scroll-behavior: smooth;
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        {/* Service Worker Registration with better error handling */}
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Добавляем задержку для Android
                  setTimeout(function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('✅ ServiceWorker registration successful');
                        
                        // Проверка обновлений каждые 6 часов
                        setInterval(function() {
                          registration.update();
                        }, 6 * 60 * 60 * 1000);
                      })
                      .catch(function(err) {
                        console.log('❌ ServiceWorker registration failed: ', err);
                      });
                  }, 1000);
                });
              }
              
              // Определение PWA режима для Android
              if (window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true) {
                console.log('📱 Running as PWA');
                document.documentElement.classList.add('pwa-mode');
              }
            `,
          }}
        />
        
        {/* Google Fonts Preconnect (опционально) */}
        <Script
          id="google-fonts-preconnect"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              const link = document.createElement('link');
              link.rel = 'preconnect';
              link.href = 'https://fonts.googleapis.com';
              document.head.appendChild(link);
              
              const link2 = document.createElement('link');
              link2.rel = 'preconnect';
              link2.href = 'https://fonts.gstatic.com';
              link2.crossOrigin = '';
              document.head.appendChild(link2);
            `,
          }}
        />
        
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}