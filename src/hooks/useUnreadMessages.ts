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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      let orders: { id: string }[] = []

      if (isAdmin) {
        const { data } = await supabase.from('orders').select('id')
        orders = data || []
      } else {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .eq('cleaner_id', user.id)
        orders = data || []
      }

      if (orders.length === 0) {
        setTotalUnread(0)
        setLoading(false)
        return
      }

      let total = 0

      for (const order of orders) {
        const { data: readData } = await supabase
          .from('order_chat_reads')
          .select('last_read_at')
          .eq('order_id', order.id)
          .eq('user_id', user.id)
          .maybeSingle()

        const lastReadAt = readData?.last_read_at || new Date(0).toISOString()

        const { count } = await supabase
          .from('order_messages')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id)
          .neq('user_id', user.id)
          .gt('created_at', lastReadAt)

        total += count || 0
      }

      setTotalUnread(total)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
      setTotalUnread(0)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Основная загрузка
  useEffect(() => {
    fetchUnreadCounts()
  }, [fetchUnreadCounts])

  // Realtime обновления
  useEffect(() => {
    const channel = supabase
      .channel('unread-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'order_messages' 
        },
        () => {
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchUnreadCounts])

  // Обновление при фокусе окна
  useEffect(() => {
    const handleFocus = () => fetchUnreadCounts()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchUnreadCounts])

  // Событие из других компонентов
  useEffect(() => {
    const handleRefresh = () => fetchUnreadCounts()
    window.addEventListener('refresh-unread', handleRefresh)
    return () => window.removeEventListener('refresh-unread', handleRefresh)
  }, [fetchUnreadCounts])

  return { 
    totalUnread, 
    loading, 
    refetch: fetchUnreadCounts 
  }
}