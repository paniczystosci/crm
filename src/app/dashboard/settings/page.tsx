// src/app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Globe, Monitor, Bell } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { locales, localeNames, localeFlags, defaultLocale } from '@/i18n/config'
import { setCookie } from 'cookies-next'
import { PushNotification } from '@/components/PushNotification'
import { PWAInstall } from '@/components/PWAInstall'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const commonT = useTranslations('common')
  const errorsT = useTranslations('errors')
  const notificationsT = useTranslations('notifications')
  
  const currentLocale = useLocale()
  const [systemLocale, setSystemLocale] = useState<string>('')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [languageSuccess, setLanguageSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

    useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  // Определяем системный язык
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]
    const supportedLocales = ['ru', 'pl', 'en', 'de']
    if (supportedLocales.includes(browserLang)) {
      setSystemLocale(browserLang)
    } else {
      setSystemLocale(defaultLocale)
    }
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError(t('minLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsMismatch'))
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError(errorsT('notFound'))
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (signInError) {
        setError(t('wrongPassword'))
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError(errorsT('serverError'))
    } finally {
      setLoading(false)
    }
  }

  const changeLanguage = async (locale: string) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`
    setLanguageSuccess(true)
    setTimeout(() => setLanguageSuccess(false), 2000)
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{commonT('back')}</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('password')}
            </p>
          </div>
        </div>
      </div>

<PWAInstall />

      {/* Language Switcher */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Globe size={20} className="text-emerald-500" />
            {commonT('language')}
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => changeLanguage(locale)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  currentLocale === locale
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-xl">{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {currentLocale === locale && <CheckCircle size={16} />}
              </button>
            ))}
          </div>
          
          {/* Информация о системном языке */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Monitor size={18} className="text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {t('systemLanguage')}: {localeNames[systemLocale as keyof typeof localeNames] || systemLocale} {localeFlags[systemLocale as keyof typeof localeFlags]}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  {t('autoDetectInfo')}
                </p>
              </div>
            </div>
          </div>
          
          {languageSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-green-600 dark:text-green-400 text-sm text-center">
                {t('languageChanged')}
              </p>
            </div>
          )}
        </div>
      </div>

<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
    <h2 className="font-semibold text-lg flex items-center gap-2">
      <Bell size={20} className="text-emerald-500" />
      {notificationsT('title')}
    </h2>
  </div>
  <div className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{notificationsT('pushNotifications')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {notificationsT('pushDescription')}
        </p>
      </div>
      <PushNotification />
    </div>
  </div>
</div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Lock size={20} className="text-emerald-500" />
            {t('password')}
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-6">
  <input 
    type="hidden" 
    name="username" 
    autoComplete="username" 
    value={user?.email || ''} 
  />
  
  {/* Визуально скрытое поле для браузера (решение проблемы) */}
  <div className="sr-only" aria-hidden="true">
    <input 
      type="text" 
      name="username" 
      autoComplete="username" 
      defaultValue={user?.email || ''} 
      readOnly
    />
  </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('currentPassword')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="current-password" // 👈 Добавьте name
                autoComplete="current-password" // 👈 Добавьте autocomplete
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('newPassword')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="new-password" // 👈 Добавьте name
                autoComplete="new-password" // 👈 Добавьте autocomplete
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-12 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password" // 👈 Добавьте name
                autoComplete="new-password" // 👈 Добавьте autocomplete
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  {t('passwordChanged')}
                </p>
                <p className="text-green-500 dark:text-green-500 text-xs mt-1">
                  {t('redirecting')}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{commonT('loading')}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>{t('changePasswordButton')}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {commonT('cancel')}
            </button>
          </div>
        </form>
      </div>

      {/* Security Note */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          🔒 {t('securityNote')}
        </p>
      </div>
    </div>
  )
}