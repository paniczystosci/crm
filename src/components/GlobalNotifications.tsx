// src/components/GlobalNotifications.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { playNotificationSound } from '@/lib/supabase/playNotificationSound'

export function GlobalNotifications() {
  const supabase = createClient()
  const lastPlayRef = useRef<number>(0)
  const channelRef = useRef<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Получаем ID пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Настройка подписки на уведомления
  useEffect(() => {
    if (!userId) return

    console.log('🔔 Setting up global notifications for user:', userId)

    // Создаем канал
    const channel = supabase.channel('global-notifications', {
      config: {
        broadcast: { ack: true },
        presence: { key: userId }
      }
    })
    
    // Добавляем обработчик новых сообщений
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `user_id=neq.${userId}`,
      },
      async (payload) => {
        console.log('📩 New message for notification:', payload.new)
        
        // Звук
        const now = Date.now()
        if (now - lastPlayRef.current > 3000) {
          console.log('🔊 Playing notification sound')
          lastPlayRef.current = now
          playNotificationSound()
        }
        
        // Браузерное уведомление
        if ('Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
          const { data: order } = await supabase
            .from('orders')
            .select('client_name')
            .eq('id', payload.new.order_id)
            .single()
          
          const notificationTitle = 'Новое сообщение в чате'
          const notificationBody = `Заказ: ${order?.client_name || payload.new.order_id.slice(0, 8)}\n${payload.new.message?.slice(0, 100) || 'Новое сообщение'}`
          
          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: '/logo.png',
            tag: `order-${payload.new.order_id}`,
          })
          
          notification.onclick = () => {
            window.focus()
            window.location.href = `/dashboard/${payload.new.is_admin ? 'admin' : 'cleaner'}/orders/${payload.new.order_id}`
          }
        }
        
        // Обновляем счетчик через событие
        window.dispatchEvent(new CustomEvent('refresh-unread'))
      }
    )
    
    // Подписываемся
    channel.subscribe((status) => {
      console.log('Global notifications channel status:', status)
    })
    
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  // Запрос разрешения на уведомления при первом рендере
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  return null
}