// src/app/(auth)/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, Mail, Lock, Sparkles, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Убираем скролл на body при монтировании
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'cleaner',
        })

      if (profileError) {
        setError('Ошибка создания профиля')
      } else {
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  const InputField = ({ 
    label, 
    name, 
    type = 'text', 
    required = false,
    icon: Icon,
    placeholder = ''
  }: { 
    label: string
    name: string
    type?: string
    required?: boolean
    icon: React.ElementType
    placeholder?: string
  }) => (
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
        focusedField === name ? 'text-emerald-500' : 'text-gray-400'
      }`}>
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        required={required}
        value={name === 'fullName' ? fullName : name === 'email' ? email : password}
        onChange={(e) => {
          if (name === 'fullName') setFullName(e.target.value)
          else if (name === 'email') setEmail(e.target.value)
          else setPassword(e.target.value)
        }}
        onFocus={() => setFocusedField(name)}
        onBlur={() => setFocusedField(null)}
        className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
        style={{
          borderColor: focusedField === name ? '#10b981' : '#e5e7eb'
        }}
        placeholder={placeholder}
      />
      <label className={`absolute left-11 -top-2.5 px-2 text-xs transition-all duration-200 bg-white dark:bg-gray-800 rounded-full ${
        focusedField === name || 
        (name === 'fullName' && fullName) || 
        (name === 'email' && email) || 
        (name === 'password' && password)
          ? 'text-emerald-500 -translate-y-0' 
          : 'text-gray-400 translate-y-0 opacity-0'
      }`}>
        {label}
      </label>
      {name === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )

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
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Pani Czystości</h1>
          <p className="text-emerald-100 text-sm">Создайте новый аккаунт</p>
        </div>

        {/* Форма регистрации */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            
            <InputField
              label="ФИО"
              name="fullName"
              required
              icon={User}
              placeholder="Иванова Анна Петровна"
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              required
              icon={Mail}
              placeholder="your@email.com"
            />

            <InputField
              label="Пароль"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              icon={Lock}
              placeholder="••••••••"
            />

            {/* Подсказка о пароле */}
            <p className="text-xs text-gray-500 mt-1">
              Пароль должен содержать минимум 6 символов
            </p>

            {/* Ошибка */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl animate-in shake duration-300">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Регистрация...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Зарегистрироваться</span>
                </>
              )}
            </button>
          </form>

          {/* Разделитель */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500">уже есть аккаунт?</span>
            </div>
          </div>

          {/* Ссылка на вход */}
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <ArrowLeft size={16} />
            <span>Войти в существующий аккаунт</span>
          </Link>

          {/* Футер */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              © 2024 Pani Czystości. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}