// src/hooks/useUnreadMessages.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUnreadCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем все заказы пользователя
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('cleaner_id', user.id)

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setTotalUnread(0)
        setLoading(false)
        return
      }

      if (!orders || orders.length === 0) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем все непрочитанные сообщения
      let total = 0
      for (const order of orders) {
        // Получаем последнее время прочтения пользователя для этого заказа
        const { data: readData } = await supabase
          .from('order_chat_reads')
          .select('last_read_at')
          .eq('order_id', order.id)
          .eq('user_id', user.id)
          .single()

        const lastReadAt = readData?.last_read_at || new Date(0).toISOString()

        // Считаем новые сообщения (не от пользователя и после последнего прочтения)
        const { count, error } = await supabase
          .from('order_messages')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id)
          .neq('user_id', user.id)
          .gt('created_at', lastReadAt)

        if (!error && count) {
          total += count
        }
      }

      setTotalUnread(total)
    } catch (error) {
      console.error('Error in fetchUnreadCounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCounts()

    // Подписка на новые сообщения
    const channel = supabase
      .channel('unread-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
        },
        () => {
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { totalUnread, loading, refetch: fetchUnreadCounts }
}