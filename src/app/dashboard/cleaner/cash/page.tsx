// src/app/dashboard/cleaner/cash/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { Calendar, DollarSign, Banknote, ArrowLeft, Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type PendingOrder = {
  id: string
  client_name: string
  price: number
  cash_received: number | null
  bank_received: number | null
  planned_date: string | null
}

export default function CleanerCashPage() {
  const t = useTranslations('common')
  const cashT = useTranslations('cash')
  const ordersT = useTranslations('orders')
  
  const [summary, setSummary] = useState({ totalCash: 0, totalBank: 0 })
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [handingOver, setHandingOver] = useState(false)

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
    if (!confirm(cashT('handoverPrompt', { cash: summary.totalCash, bank: summary.totalBank }))) return

    setHandingOver(true)
    
    setTimeout(() => {
      alert(cashT('handoverSuccess'))
      setHandingOver(false)
      fetchCash()
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  const hasMoney = summary.totalCash > 0 || summary.totalBank > 0

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/dashboard/cleaner"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{ordersT('backToOrders')}</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {cashT('title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {cashT('cashReceived')} {t('and')} {cashT('bankReceived')}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleHandover}
            disabled={!hasMoney || handingOver}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform active:scale-[0.98] shadow-md ${
              hasMoney && !handingOver
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {handingOver ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <Banknote size={18} />
                <span>{cashT('handoverCash')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Cash Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <TrendingUp size={20} className="text-emerald-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{cashT('cashReceived')}</p>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalCash} zł</p>
            <p className="text-xs text-gray-400 mt-2">{cashT('awaitingIncassation')}</p>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>

        {/* Bank Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <TrendingUp size={20} className="text-blue-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{cashT('bankReceived')}</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{summary.totalBank} zł</p>
            <p className="text-xs text-gray-400 mt-2">{cashT('awaitingIncassation')}</p>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>
      </div>

{/* Пульсирующее уведомление если есть деньги */}
{hasMoney && (
  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <Clock size={20} className="text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {cashT('hasFunds')}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {cashT('handoverPrompt', { cash: summary.totalCash, bank: summary.totalBank })}
        </p>
      </div>
    </div>
  </div>
)}

      {/* Orders List */}
      {pendingOrders.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Calendar size={20} className="text-emerald-500" />
                {cashT('ordersAwaiting')}
              </h2>
              <span className="text-xs text-gray-500">{pendingOrders.length} {pendingOrders.length === 1 ? ordersT('order') : ordersT('orders')}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingOrders.map((order, idx) => (
              <div 
                key={order.id} 
                className="p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {order.client_name}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {order.planned_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 font-mono">
                        ID: {order.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {order.cash_received ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                        <DollarSign size={16} className="text-emerald-600" />
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {order.cash_received} zł {t('cash')}
                        </span>
                      </div>
                    ) : order.bank_received ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                        <Banknote size={16} className="text-blue-600" />
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          {order.bank_received} zł {t('bankTransfer')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <CheckCircle size={40} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xl font-medium text-gray-900 dark:text-white">{cashT('noOrders')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {cashT('allHandedOver')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>{cashT('handoverSuccess')}</p>
      </div>
    </div>
  )
}