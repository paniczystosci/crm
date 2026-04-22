// src/components/GlobalNotifications.tsx
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { playNotificationSound } from '@/lib/supabase/playNotificationSound'

export function GlobalNotifications() {
  const supabase = createClient()
  const lastPlayRef = useRef<number>(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    let isSubscribed = true

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isSubscribed) {
          console.log('❌ No user for notifications')
          return
        }

        // Получаем роль пользователя
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isAdmin = profile?.role === 'admin'
        console.log(`🔔 Setting up notifications for ${isAdmin ? 'admin' : 'cleaner'}:`, user.id)

        // Создаем канал
        const channel = supabase.channel('global-notifications')
        
        // Добавляем обработчик новых сообщений
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `user_id=neq.${user.id}`,
          },
          async (payload) => {
            if (!isSubscribed) return
            
            console.log('📩 New message for notification:', payload.new)
            
            // Звук
            const now = Date.now()
            if (now - lastPlayRef.current > 3000 && !document.hasFocus()) {
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
              
              const notificationTitle = isAdmin ? 'Новое сообщение в чате' : 'Новое сообщение от администратора'
              const notificationBody = `Заказ: ${order?.client_name || payload.new.order_id.slice(0, 8)}\n${payload.new.message?.slice(0, 100) || 'Новое сообщение'}`
              
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/logo.png',
                tag: `order-${payload.new.order_id}`,
              })
            }
          }
        )
        
        // Подписываемся
        channel.subscribe((status) => {
          console.log('Global notifications channel status:', status)
        })
        
        channelRef.current = channel
      } catch (error) {
        console.error('Error setting up global notifications:', error)
      }
    }

    setupSubscription()

    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }

    return () => {
      isSubscribed = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return null
}