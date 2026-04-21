// src/app/(dashboard)/cleaner/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Loader2 } from 'lucide-react'

export default function NewOrderPage() {
  const [form, setForm] = useState({
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

  const router = useRouter()
  const supabase = createClient()

  // Загружаем доступные слоты при изменении даты
  useEffect(() => {
    if (form.planned_date) {
      loadAvailableTimes(form.planned_date)
    } else {
      setAvailableTimes([])
    }
  }, [form.planned_date])

  async function loadAvailableTimes(date: string) {
    setLoading(true)
    // Получаем все занятые времена на эту дату для текущего клинера
    const { data: occupied } = await supabase
      .from('orders')
      .select('planned_time')
      .eq('planned_date', date)
      .eq('cleaner_id', (await supabase.auth.getUser()).data.user?.id)
      .not('status', 'eq', 'cancelled')

    const occupiedTimes = occupied?.map(o => o.planned_time?.slice(0, 5)) || []

    // Генерируем возможные слоты с 8:00 до 20:00 каждые 30 минут
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
      salary_type: 'manual', // по умолчанию
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Новый заказ</h1>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Имя клиента</label>
            <input
              type="text"
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Телефон клиента</label>
            <input
              type="tel"
              required
              value={form.client_phone}
              onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Адрес</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ссылка Google Maps (опционально)</label>
          <input
            type="url"
            value={form.google_maps_link}
            onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Дата уборки</label>
            <input
              type="date"
              required
              value={form.planned_date}
              onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Время начала</label>
            <select
              required
              value={form.planned_time}
              onChange={(e) => setForm({ ...form, planned_time: e.target.value })}
              disabled={loading || !form.planned_date}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Выберите время</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {loading && <p className="text-xs text-zinc-500 mt-1">Загрузка доступных слотов...</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Цена (zł)</label>
          <input
            type="number"
            required
            step="0.01"
            min="1"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Комментарий (опционально)</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-lg"
        >
          {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Создать заказ'}
        </button>
      </form>
    </div>
  )
}