// src/app/dashboard/admin/cleaners/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserPlus, DollarSign, Banknote, CheckCircle, X, Users, Percent, Shield, Sparkles } from 'lucide-react'
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

  const getRateLabel = (rate: string) => {
    if (rate === 'manual') return 'Ручная'
    return `${rate}%`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users size={20} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Команда
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-13">
              Управление сотрудниками и их выплатами
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-2xl font-medium transition-all duration-200 shadow-md hover:shadow-xl"
          >
            <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
            <span>Добавить сотрудника</span>
          </button>
        </div>

        {/* Форма добавления */}
        {showForm && (
          <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                <div className="relative p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добавить нового сотрудника</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Заполните информацию для создания аккаунта</p>
                    </div>
                    <button
                      onClick={() => { setShowForm(false); setFormData({ full_name: '', email: '', role: 'cleaner', payout_rate: '25' }) }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ФИО
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={formData.full_name} 
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                          placeholder="Иван Иванов"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input 
                          type="email" 
                          required 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                          placeholder="ivan@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Роль
                        </label>
                        <select 
                          value={formData.role} 
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'cleaner' })} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        >
                          <option value="cleaner">Клинер</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ставка выплаты клинеру
                        </label>
                        <select 
                          value={formData.payout_rate} 
                          onChange={(e) => setFormData({ ...formData, payout_rate: e.target.value })} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        >
                          <option value="15">15%</option>
                          <option value="25">25%</option>
                          <option value="50">50%</option>
                          <option value="manual">Ручная сумма</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="submit" 
                        disabled={submitting} 
                        className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white py-3.5 rounded-xl font-medium transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Создаём...
                          </span>
                        ) : (
                          'Создать сотрудника'
                        )}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowForm(false); setFormData({ full_name: '', email: '', role: 'cleaner', payout_rate: '25' }) }} 
                        className="flex-1 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Список сотрудников */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-white">Список сотрудников</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Управление ролями и выплатами</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <Users size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cleaners.length} человек</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-rose-600 border-t-transparent"></div>
                <span>Загрузка сотрудников...</span>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cleaners.map((person, idx) => (
                <div 
                  key={person.id} 
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 animate-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Левая часть - информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner">
                          <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                            {person.full_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                            {person.full_name || 'Без имени'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                            ID: {person.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Правая часть - информация */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      
                      {/* Роль */}
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-gray-400" />
                        <span className={`px-4 py-1.5 text-sm rounded-xl font-medium whitespace-nowrap ${
                          person.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        }`}>
                          {person.role === 'admin' ? 'Администратор' : 'Клинер'}
                        </span>
                      </div>

                      {/* Ставка */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Percent size={12} />
                          <span>СТАВКА</span>
                        </div>
                        <select
                          value={person.payout_rate}
                          onChange={(e) => updatePayoutRate(person.id, e.target.value)}
                          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer hover:border-rose-300"
                        >
                          <option value="15">15%</option>
                          <option value="25">25%</option>
                          <option value="50">50%</option>
                          <option value="manual">Ручная</option>
                        </select>
                      </div>

                      {/* КАССА (только для клинеров) */}
                      {person.role === 'cleaner' && (
                        <div className="flex flex-col">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">КАССА</div>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl">
                                <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">{person.totalCash} zł</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl">
                                <Banknote size={16} className="text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-blue-700 dark:text-blue-300">{person.totalBank} zł</span>
                              </div>
                            </div>

                            {(person.totalCash > 0 || person.totalBank > 0) && (
                              <button
                                onClick={() => confirmIncassation(person.id, person.full_name || 'Клинер')}
                                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                              >
                                <CheckCircle size={16} />
                                Подтвердить
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {cleaners.length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <Users size={48} className="text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Нет сотрудников</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Добавить первого сотрудника →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2024 Управление клинингом • Система управления сотрудниками</p>
        </div>
      </div>
    </div>
  )
}