// src/components/NotificationSound.tsx
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export function NotificationSound() {
  const supabase = createClient()
  const lastPlayRef = useRef<number>(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    let isSubscribed = true

    const playSound = () => {
      if (!isSubscribed) return
      
      const now = Date.now()
      // Ограничиваем частоту звука (не чаще раза в 3 секунды)
      if (now - lastPlayRef.current < 3000) return
      lastPlayRef.current = now

      try {
        // Пробуем использовать Web Audio API для создания простого звука
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const audioContext = new AudioContext()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = 800
          gainNode.gain.value = 0.2
          
          oscillator.start()
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5)
          oscillator.stop(audioContext.currentTime + 0.5)
          
          if (audioContext.state === 'suspended') {
            audioContext.resume()
          }
        }
      } catch (error) {
        console.log('Audio error:', error)
      }
    }

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isSubscribed) return

        // ВАЖНО: Сначала создаем канал с обработчиками, потом подписываемся
        const channel = supabase.channel('notification-sound')
        
        // Добавляем обработчики ДО подписки
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `user_id=neq.${user.id}`,
          },
          (payload) => {
            if (!isSubscribed) return
            // Воспроизводим звук только если чат не в фокусе
            if (!document.hasFocus()) {
              playSound()
            }
          }
        )
        
        // Теперь подписываемся
        channel.subscribe((status) => {
          console.log('Notification channel status:', status)
        })
        
        channelRef.current = channel
      } catch (error) {
        console.error('Error setting up notification sound:', error)
      }
    }

    setupSubscription()

    return () => {
      isSubscribed = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return null
}