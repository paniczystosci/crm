// src/app/(dashboard)/cleaner/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Loader2, User, Phone, MapPin, Link2, MessageSquare, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type FormData = {
  client_name: string
  client_phone: string
  address: string
  google_maps_link: string
  comment: string
  price: string
  planned_date: string
  planned_time: string
}

export default function NewOrderPage() {
  const [form, setForm] = useState<FormData>({
    client_name: '',
    client_phone: '',
    address: '',
    google_maps_link: '',
    comment: '',
    price: '',
    planned_date: '',
    planned_time: '',
  })

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (form.planned_date) {
      loadAvailableTimes(form.planned_date)
    } else {
      setAvailableTimes([])
    }
  }, [form.planned_date])

  async function loadAvailableTimes(date: string) {
    setLoading(true)
    const { data: occupied } = await supabase
      .from('orders')
      .select('planned_time')
      .eq('planned_date', date)
      .eq('cleaner_id', (await supabase.auth.getUser()).data.user?.id)
      .not('status', 'eq', 'cancelled')

    const occupiedTimes = occupied?.map(o => o.planned_time?.slice(0, 5)) || []

    const allSlots: string[] = []
    for (let h = 8; h <= 19; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        if (!occupiedTimes.includes(time)) {
          allSlots.push(time)
        }
      }
    }

    setAvailableTimes(allSlots)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('orders').insert({
      client_name: form.client_name,
      client_phone: form.client_phone,
      address: form.address,
      google_maps_link: form.google_maps_link || null,
      comment: form.comment || null,
      price: parseFloat(form.price),
      planned_date: form.planned_date,
      planned_time: form.planned_time,
      cleaner_id: user?.id,
      status: 'new',
      salary_type: 'manual',
      salary_value: null,
    })

    if (error) {
      alert('Ошибка создания заказа: ' + error.message)
    } else {
      router.push('/dashboard/cleaner')
      router.refresh()
    }

    setSubmitting(false)
  }

  const handleInputChange = (name: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
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
    name: keyof FormData
    type?: string
    required?: boolean
    icon: React.ElementType
    placeholder?: string
  }) => (
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ${
        focusedField === name || form[name] ? 'text-emerald-500' : 'text-gray-400'
      }`}>
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        required={required}
        value={form[name]}
        onChange={(e) => handleInputChange(name, e.target.value)}
        onFocus={() => setFocusedField(name)}
        onBlur={() => setFocusedField(null)}
        className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
        style={{
          borderColor: focusedField === name ? '#10b981' : '#e5e7eb'
        }}
        placeholder={placeholder}
      />
      <label className={`absolute left-11 -top-2.5 px-2 text-xs transition-all duration-200 bg-white dark:bg-gray-800 rounded-full ${
        focusedField === name || form[name] ? 'text-emerald-500 -translate-y-0' : 'text-gray-400 translate-y-0 opacity-0'
      }`}>
        {label}
      </label>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/dashboard/cleaner"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Назад к заказам</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Новый заказ
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Заполните информацию о клиенте и уборке
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Информация о клиенте */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User size={20} className="text-emerald-500" />
            Информация о клиенте
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Имя клиента"
              name="client_name"
              required
              icon={User}
              placeholder="Введите имя"
            />
            <InputField
              label="Телефон"
              name="client_phone"
              type="tel"
              required
              icon={Phone}
              placeholder="+48 123 456 789"
            />
          </div>
          
          <InputField
            label="Адрес"
            name="address"
            required
            icon={MapPin}
            placeholder="Улица, дом, квартира"
          />
          
          <InputField
            label="Ссылка Google Maps"
            name="google_maps_link"
            type="url"
            icon={Link2}
            placeholder="https://maps.google.com/..."
          />
        </div>

        {/* Детали заказа */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />
            Детали заказа
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 text-gray-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                required
                value={form.planned_date}
                onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 text-gray-400">
                <Clock size={18} />
              </div>
              <select
                required
                value={form.planned_time}
                onChange={(e) => setForm({ ...form, planned_time: e.target.value })}
                disabled={loading || !form.planned_date}
                className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Выберите время</option>
                {availableTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {loading && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Загрузка доступных слотов...
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 text-gray-400">
              <DollarSign size={18} />
            </div>
            <input
              type="number"
              required
              step="0.01"
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
              placeholder="0.00"
            />
            <label className="absolute left-11 -top-2.5 px-2 text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-full">
              Цена (zł)
            </label>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-5 transition-all duration-200 text-gray-400">
              <MessageSquare size={18} />
            </div>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              className="w-full pl-11 pr-4 py-3.5 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200 resize-none"
              placeholder="Дополнительная информация..."
            />
            <label className="absolute left-11 -top-2.5 px-2 text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-full">
              Комментарий
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Создание...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Создать заказ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}