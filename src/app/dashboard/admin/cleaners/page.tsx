// src/app/dashboard/admin/cleaners/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserPlus, DollarSign, Banknote, CheckCircle } from 'lucide-react'
import { createNewUser } from '@/app/actions/createUser'

type Cleaner = {
  id: string
  full_name: string | null
  role: 'admin' | 'cleaner'
  payout_rate: string
  totalCash: number
  totalBank: number
}

export default function AdminCleaners() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'cleaner' as 'admin' | 'cleaner',
    payout_rate: '25' as string
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCleaners()
  }, [])

  async function fetchCleaners() {
    setLoading(true)

    const { data: profilesData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, payout_rate')

    if (profileError) {
      console.error('Ошибка загрузки сотрудников:', profileError)
      setLoading(false)
      return
    }

    const profiles = profilesData || []

    const { data: paymentsData } = await supabase
      .from('orders')
      .select('cleaner_id, cash_received, bank_received')
      .eq('status', 'done')
      .eq('is_incassed', false)

    const cashMap: Record<string, { cash: number; bank: number }> = {}

    paymentsData?.forEach((order) => {
      if (!order.cleaner_id) return
      if (!cashMap[order.cleaner_id]) {
        cashMap[order.cleaner_id] = { cash: 0, bank: 0 }
      }
      cashMap[order.cleaner_id].cash += order.cash_received || 0
      cashMap[order.cleaner_id].bank += order.bank_received || 0
    })

    const cleanersWithCash = profiles.map((p: any) => ({
      ...p,
      totalCash: cashMap[p.id]?.cash || 0,
      totalBank: cashMap[p.id]?.bank || 0,
    }))

    setCleaners(cleanersWithCash)
    setLoading(false)
  }

  const updatePayoutRate = async (id: string, newRate: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ payout_rate: newRate })
      .eq('id', id)

    if (error) alert('Ошибка обновления ставки')
    else fetchCleaners()
  }

  const confirmIncassation = async (cleanerId: string, cleanerName: string) => {
    if (!confirm(`Подтвердить инкассацию для ${cleanerName}?\nВсе наличные и оплаты на счёт будут отмечены как принятые.`)) return

    const { error } = await supabase
      .from('orders')
      .update({ is_incassed: true })
      .eq('cleaner_id', cleanerId)
      .eq('status', 'done')
      .eq('is_incassed', false)

    if (error) alert('Ошибка при подтверждении инкассации')
    else {
      alert(`Инкассация для ${cleanerName} успешно подтверждена!`)
      fetchCleaners()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.email) return

    setSubmitting(true)
    const result = await createNewUser(
      formData.full_name.trim(),
      formData.email.trim().toLowerCase(),
      formData.role,
      formData.payout_rate
    )

    if (result.success) {
      alert(result.message)
      setFormData({ full_name: '', email: '', role: 'cleaner', payout_rate: '25' })
      setShowForm(false)
      fetchCleaners()
    } else {
      alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'))
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Команда</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
        >
          <UserPlus size={20} />
          Добавить сотрудника
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="card p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Добавить нового сотрудника</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ФИО</label>
              <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Роль</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'cleaner' })} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500">
                <option value="cleaner">Клинер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ставка выплаты клинеру</label>
              <select value={formData.payout_rate} onChange={(e) => setFormData({ ...formData, payout_rate: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500">
                <option value="15">15%</option>
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="manual">Ручная сумма</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={submitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-medium">
                {submitting ? 'Создаём...' : 'Создать сотрудника'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormData({ full_name: '', email: '', role: 'cleaner', payout_rate: '25' }) }} className="flex-1 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список сотрудников */}
      <div className="card">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-semibold text-xl">Список сотрудников</h2>
          <div className="text-sm text-zinc-500">{cleaners.length} человек</div>
        </div>

        {loading ? (
          <div className="p-12 text-center">Загрузка...</div>
        ) : (
          <div className="divide-y">
            {cleaners.map((person) => (
              <div key={person.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Левая часть */}
                <div className="flex-1">
                  <div className="font-medium text-lg">{person.full_name || 'Без имени'}</div>
                  <div className="text-sm text-zinc-500 font-mono">{person.id}</div>
                </div>

                {/* Правая часть (адаптивная) */}
                <div className="flex flex-wrap items-center gap-6 md:gap-8">
                  
                  {/* Роль */}
                  <span className={`px-5 py-1.5 text-sm rounded-full font-medium whitespace-nowrap ${
                    person.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {person.role === 'admin' ? 'Администратор' : 'Клинер'}
                  </span>

                  {/* Ставка */}
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-zinc-500 font-mono mb-1">СТАВКА</span>
                    <select
                      value={person.payout_rate}
                      onChange={(e) => updatePayoutRate(person.id, e.target.value)}
                      className="px-4 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:border-rose-500"
                    >
                      <option value="15">15%</option>
                      <option value="25">25%</option>
                      <option value="50">50%</option>
                      <option value="manual">Ручная</option>
                    </select>
                  </div>

                  {/* КАССА (только для клинеров) */}
                  {person.role === 'cleaner' && (
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-xs text-zinc-500 font-mono mb-1">КАССА</span>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-600 text-sm">
                            <DollarSign size={16} />
                            <span className="font-semibold">{person.totalCash} zł</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <Banknote size={16} />
                            <span className="font-semibold">{person.totalBank} zł</span>
                          </div>
                        </div>

                        {(person.totalCash > 0 || person.totalBank > 0) && (
                          <button
                            onClick={() => confirmIncassation(person.id, person.full_name || 'Клинер')}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-2xl text-sm font-medium transition whitespace-nowrap"
                          >
                            <CheckCircle size={18} />
                            Подтвердить
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}