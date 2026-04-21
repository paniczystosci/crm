// src/app/dashboard/cleaner/cash/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Calendar, DollarSign, Banknote } from 'lucide-react'
import Link from 'next/link'

export default function CleanerCashPage() {
  const [summary, setSummary] = useState({ totalCash: 0, totalBank: 0 })
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchCash()
  }, [])

  async function fetchCash() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('orders')
      .select('id, client_name, price, cash_received, bank_received, planned_date')
      .eq('cleaner_id', user.id)
      .eq('status', 'done')
      .eq('is_incassed', false)

    if (data) {
      const totalCash = data.reduce((sum, o) => sum + (o.cash_received || 0), 0)
      const totalBank = data.reduce((sum, o) => sum + (o.bank_received || 0), 0)
      setSummary({ totalCash, totalBank })
      setPendingOrders(data)
    }
    setLoading(false)
  }

  const handleHandover = async () => {
    if (!confirm(`Сдать кассу?\nНаличные: ${summary.totalCash} zł\nНа счёт: ${summary.totalBank} zł`)) return

    // Клинер «сдаёт» — дальше админ подтверждает (is_incassed = true)
    alert('Касса сдана! Ожидайте подтверждения администратора.')
    // Можно добавить уведомление админу через realtime, но для начала — просто UI
    fetchCash() // обновляем список (пока ничего не обнуляем)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Касса</h1>
        <button
          onClick={handleHandover}
          disabled={summary.totalCash === 0 && summary.totalBank === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-medium flex items-center gap-3"
        >
          <Banknote size={24} />
          Сдать кассу
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500">Наличные</p>
              <p className="text-5xl font-bold text-emerald-600 mt-2">{summary.totalCash} zł</p>
            </div>
            <DollarSign size={64} className="text-emerald-200" />
          </div>
        </div>
        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500">На счёт фирмы</p>
              <p className="text-5xl font-bold text-blue-600 mt-2">{summary.totalBank} zł</p>
            </div>
            <Banknote size={64} className="text-blue-200" />
          </div>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="card">
          <div className="p-6 border-b font-semibold">Заказы, ожидающие инкассации</div>
          <div className="divide-y">
            {pendingOrders.map((o) => (
              <div key={o.id} className="p-6 flex justify-between items-center">
                <div>
                  <div className="font-medium">{o.client_name}</div>
                  <div className="text-sm text-zinc-500">
                    {o.planned_date && new Date(o.planned_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="text-right">
                  {o.cash_received ? (
                    <div className="text-emerald-600 font-semibold">{o.cash_received} zł наличными</div>
                  ) : (
                    <div className="text-blue-600 font-semibold">{o.bank_received} zł на счёт</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/dashboard/cleaner" className="mt-8 inline-flex text-rose-600 hover:underline">
        ← Вернуться к заказам
      </Link>
    </div>
  )
}