// src/app/auth/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations('auth')
  const commonT = useTranslations('common')
  const errorsT = useTranslations('errors')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    const savedPassword = localStorage.getItem('remembered_password')
    const remember = localStorage.getItem('remember_me') === 'true'
    
    if (remember && savedEmail) {
      setEmail(savedEmail)
      if (savedPassword) setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email)
        localStorage.setItem('remembered_password', password)
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remembered_email')
        localStorage.removeItem('remembered_password')
        localStorage.setItem('remember_me', 'false')
      }
      
      router.push('/dashboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Декоративные элементы */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      {/* Основная карточка */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-8 duration-500 my-8">
        
        {/* Логотип и название */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-3xl mb-4 shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">CRM CC</h1>
          <p className="text-emerald-100 text-sm">{t('subtitle')}</p>
        </div>

        {/* Форма входа */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email поле */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                emailFocused || email ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                className="w-full pl-11 pr-4 py-3.5 text-base bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                style={{
                  borderColor: emailFocused ? '#10b981' : '#e5e7eb',
                }}
                placeholder={t('emailPlaceholder')}
              />
              <label className={`absolute left-11 -top-2.5 px-2 text-xs transition-all duration-200 bg-white rounded-full ${
                emailFocused || email ? 'text-emerald-500 -translate-y-0' : 'text-gray-400 translate-y-0 opacity-0'
              }`}>
                {t('emailLabel')}
              </label>
            </div>

            {/* Password поле */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                passwordFocused || password ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="w-full pl-11 pr-12 py-3.5 text-base bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                style={{
                  borderColor: passwordFocused ? '#10b981' : '#e5e7eb',
                }}
                placeholder={t('passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <label className={`absolute left-11 -top-2.5 px-2 text-xs transition-all duration-200 bg-white rounded-full ${
                passwordFocused || password ? 'text-emerald-500 -translate-y-0' : 'text-gray-400 translate-y-0 opacity-0'
              }`}>
                {t('passwordLabel')}
              </label>
            </div>

            {/* Запомнить меня */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all ${
                    rememberMe 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'border-gray-300 group-hover:border-emerald-400'
                  }`}>
                    {rememberMe && <CheckCircle size={16} className="text-white absolute top-0.5 left-0.5" />}
                  </div>
                </div>
                <span className="text-sm text-gray-600 cursor-pointer select-none">
                  {t('rememberMe')}
                </span>
              </label>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl animate-in shake duration-300">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{commonT('loading')}</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{commonT('login')}</span>
                </>
              )}
            </button>
          </form>

          {/* Футер */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              © 2026 CRM Cleaning Company. {t('footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}