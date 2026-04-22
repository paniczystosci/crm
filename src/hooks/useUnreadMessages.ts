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
      console.log('🔄 Fetching unread counts...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No user found')
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем все заказы пользователя (как клинера)
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

      console.log(`📦 Found ${orders?.length || 0} orders`)

      if (!orders || orders.length === 0) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      // Получаем все непрочитанные сообщения
      let total = 0
      for (const order of orders) {
        // Получаем последнее время прочтения
        const { data: readData } = await supabase
          .from('order_chat_reads')
          .select('last_read_at')
          .eq('order_id', order.id)
          .eq('user_id', user.id)
          .single()

        const lastReadAt = readData?.last_read_at || new Date(0).toISOString()

        // Считаем новые сообщения
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
        (payload) => {
          console.log('📩 New message detected!', payload.new)
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // В конце файла src/hooks/useUnreadMessages.ts добавьте:

useEffect(() => {
  const handleFocus = () => {
    console.log('Window focused, refreshing unread count...')
    fetchUnreadCounts()
  }
  
  window.addEventListener('focus', handleFocus)
  return () => window.removeEventListener('focus', handleFocus)
}, [])

  return { totalUnread, loading, refetch: fetchUnreadCounts }
}