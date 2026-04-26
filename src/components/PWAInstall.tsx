// src/components/PWAInstall.tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, X, Smartphone, Laptop, Tablet } from 'lucide-react'

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstall() {
  const t = useTranslations('pwa')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    // Определяем платформу
    const userAgent = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios')
    } else if (/Android/.test(userAgent)) {
      setPlatform('android')
    } else {
      setPlatform('other')
    }

    // Проверяем, установлено ли уже приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Слушаем событие beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    })

    // Слушаем событие установки
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {})
      window.removeEventListener('appinstalled', () => {})
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  // Показываем инструкции для iOS
  const IOSInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">1</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t('iosStep1')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('iosStep1Desc')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">2</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t('iosStep2')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('iosStep2Desc')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">3</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t('iosStep3')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('iosStep3Desc')}</p>
        </div>
      </div>
    </div>
  )

  const AndroidInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">1</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t('androidStep1')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('androidStep1Desc')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">2</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{t('androidStep2')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('androidStep2Desc')}</p>
        </div>
      </div>
    </div>
  )

  if (isInstalled) return null

  // Баннер с предложением установки (для desktop и Android с поддержкой beforeinstallprompt)
  if (showBanner && deferredPrompt && platform !== 'ios') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Download size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('installTitle')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('installDescription')}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  {t('install')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Для iOS показываем инструкцию в настройках
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Download size={20} className="text-emerald-500" />
          {t('title')}
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            {platform === 'ios' ? (
              <Smartphone size={32} className="text-white" />
            ) : platform === 'android' ? (
              <Smartphone size={32} className="text-white" />
            ) : (
              <Laptop size={32} className="text-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{t('description')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('benefits')}</p>
          </div>
        </div>

        {platform === 'ios' && <IOSInstructions />}
        {platform === 'android' && !deferredPrompt && <AndroidInstructions />}
        {platform === 'other' && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">{t('desktopSupport')}</p>
            <p className="text-xs text-gray-400 mt-2">{t('desktopHint')}</p>
          </div>
        )}

        {platform === 'other' && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            {t('installApp')}
          </button>
        )}
      </div>
    </div>
  )
}