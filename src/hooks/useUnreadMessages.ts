// src/hooks/useUnreadMessages.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUnreadCounts = useCallback(async () => {
    try {
      console.log('🔄 Fetching unread counts...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No user found')
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем роль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'
      console.log(`👤 User role: ${isAdmin ? 'admin' : 'cleaner'}`)

      let orders: any[] = []

      if (isAdmin) {
        // Админ: получаем ВСЕ заказы
        const { data: allOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id')

        if (ordersError) {
          console.error('Error fetching orders for admin:', ordersError)
          setTotalUnread(0)
          setLoading(false)
          return
        }
        orders = allOrders || []
        console.log(`📦 Admin: found ${orders.length} total orders`)
      } else {
        // Клинер: получаем только свои заказы
        const { data: cleanerOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('cleaner_id', user.id)

        if (ordersError) {
          console.error('Error fetching orders for cleaner:', ordersError)
          setTotalUnread(0)
          setLoading(false)
          return
        }
        orders = cleanerOrders || []
        console.log(`📦 Cleaner: found ${orders.length} orders`)
      }

      if (!orders || orders.length === 0) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем все непрочитанные сообщения
      let total = 0
      for (const order of orders) {
        // Получаем последнее время прочтения для этого пользователя
        const { data: readData } = await supabase
          .from('order_chat_reads')
          .select('last_read_at')
          .eq('order_id', order.id)
          .eq('user_id', user.id)
          .single()

        const lastReadAt = readData?.last_read_at || new Date(0).toISOString()

        // Считаем новые сообщения (не от текущего пользователя)
        const { count, error } = await supabase
          .from('order_messages')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id)
          .neq('user_id', user.id)
          .gt('created_at', lastReadAt)

        if (!error && count && count > 0) {
          console.log(`📨 Order ${order.id.slice(0,8)}: ${count} unread messages`)
          total += count
        }
      }

      console.log(`🔔 Total unread: ${total}`)
      setTotalUnread(total)
    } catch (error) {
      console.error('Error in fetchUnreadCounts:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Первоначальная загрузка
  useEffect(() => {
    fetchUnreadCounts()
  }, [fetchUnreadCounts])

  // Подписка на новые сообщения в реальном времени
  useEffect(() => {
    const channel = supabase
      .channel('unread-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
        },
        (payload) => {
          console.log('📩 New message detected for unread count!', payload.new)
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchUnreadCounts])

  // Обновляем при фокусе на окне
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing unread count...')
      fetchUnreadCounts()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchUnreadCounts])

  // Слушаем событие обновления счетчика
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Refresh unread event received')
      fetchUnreadCounts()
    }
    
    window.addEventListener('refresh-unread', handleRefresh)
    return () => window.removeEventListener('refresh-unread', handleRefresh)
  }, [fetchUnreadCounts])

  return { totalUnread, loading, refetch: fetchUnreadCounts }
}