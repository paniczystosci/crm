// src/app/auth/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles, CheckCircle, Fingerprint, Shield } from 'lucide-react'

export default function LoginPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
      
      {/* Декоративные элементы */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Основная карточка */}
      <div className="relative w-full max-w-[400px] animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Логотип и название */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-3xl mb-4 shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Pani Czystości</h1>
          <p className="text-emerald-100 text-sm">Добро пожаловать!</p>
        </div>

        {/* Форма входа */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email поле */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                emailFocused || email ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                style={{
                  borderColor: emailFocused ? '#10b981' : '#e5e7eb',
                }}
                placeholder="Email"
              />
              <label className={`absolute left-12 -top-2.5 px-2 text-xs transition-all duration-200 bg-white rounded-full ${
                emailFocused || email ? 'text-emerald-500 -translate-y-0' : 'text-gray-400 translate-y-0 opacity-0'
              }`}>
                Email
              </label>
            </div>

            {/* Password поле */}
            <div className="relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                passwordFocused || password ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="w-full pl-12 pr-12 py-4 text-base bg-gray-50 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                style={{
                  borderColor: passwordFocused ? '#10b981' : '#e5e7eb',
                }}
                placeholder="Пароль"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <label className={`absolute left-12 -top-2.5 px-2 text-xs transition-all duration-200 bg-white rounded-full ${
                passwordFocused || password ? 'text-emerald-500 -translate-y-0' : 'text-gray-400 translate-y-0 opacity-0'
              }`}>
                Пароль
              </label>
            </div>

            {/* Запомнить меня и forgot password */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  Запомнить меня
                </span>
              </label>
              
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors text-left sm:text-right"
              >
                Забыли пароль?
              </button>
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
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl transition-all duration-200 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Вход...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Войти</span>
                </>
              )}
            </button>

            {/* Быстрый вход через demo */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">или</span>
              </div>
            </div>

            {/* Демо-кнопки */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@example.com')
                  setPassword('123456')
                }}
                className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                Админ
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('cleaner@example.com')
                  setPassword('123456')
                }}
                className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Fingerprint size={16} />
                Клинер
              </button>
            </div>

            {/* Доп. информация */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Пароль для всех demo: <span className="font-mono font-semibold">123456</span>
              </p>
            </div>
          </form>

          {/* Футер */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              © 2024 Pani Czystości. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}