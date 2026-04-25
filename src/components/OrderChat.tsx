// src/components/OrderChat.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { MessageBubble } from './chat/MessageBubble'
import { MessageGroup } from './chat/MessageGroup'
import { TypingIndicator } from './chat/TypingIndicator'
import { ChatInput } from './chat/ChatInput'
import { markMessagesAsRead } from '@/lib/supabase/markMessagesAsRead'
import { MessageCircle, Users } from 'lucide-react'

type OrderChatProps = {
  orderId: string
  isAdmin?: boolean
}

export default function OrderChat({ orderId, isAdmin = false }: OrderChatProps) {
  const t = useTranslations('common')
  const chatT = useTranslations('chat')
  
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const typingTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Загружаем пользователя
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    loadUser()
  }, [])

  // Функция для отметки сообщений как прочитанных и обновления счетчика
  const markCurrentOrderAsRead = async () => {
    if (!user || !orderId) return
    
    try {
      await markMessagesAsRead(orderId, user.id)
      window.dispatchEvent(new CustomEvent('refresh-unread'))
      console.log('✅ Marked order as read:', orderId.slice(0, 8))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Отметить сообщения как прочитанные при открытии чата
  useEffect(() => {
    if (!user || !orderId) return
    
    markCurrentOrderAsRead()
    
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        markCurrentOrderAsRead()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [user, orderId])

  // Загружаем сообщения и подписываемся на realtime
  useEffect(() => {
    if (!user || !orderId) return

    let isSubscribed = true

    const loadMessages = async () => {
      try {
        const { data: existingMessages, error } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })

        if (!error && existingMessages && isSubscribed) {
          setMessages(existingMessages)
          scrollToBottom()
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    const setupRealtime = () => {
      try {
        const channel = supabase.channel(`order-messages-${orderId}`)
        
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          async (payload) => {
            if (!isSubscribed) return
            
            console.log('New message received:', payload.new)
            
            setMessages(prev => [...prev, payload.new])
            scrollToBottom()
            
            if (document.hasFocus()) {
              await markCurrentOrderAsRead()
            }
          }
        )
        
        channel.on('broadcast', { event: 'typing' }, (payload) => {
          if (isSubscribed) {
            setTypingUser(payload.payload.user)
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
              if (isSubscribed) setTypingUser(null)
            }, 1500)
          }
        })
        
        channel.subscribe((status) => {
          console.log('Channel status:', status)
        })
        
        channelRef.current = channel
      } catch (error) {
        console.error('Error setting up realtime:', error)
      }
    }

    loadMessages()
    setupRealtime()

    const handleFocus = () => {
      markCurrentOrderAsRead()
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      isSubscribed = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, orderId])

  // Группировка сообщений по датам
  const groups = messages.reduce((acc: any, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('ru-RU')
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-gray-400 text-sm">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[550px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      
      {/* Заголовок */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              {chatT('title')}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users size={12} />
              <span>{isAdmin ? chatT('cleanerChat') : chatT('adminChat')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {Object.keys(groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {chatT('noMessages')}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {chatT('startChat')}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([date, msgs]: any) => (
            <MessageGroup
              key={date}
              date={date}
              messages={msgs}
              userId={user.id}
            />
          ))
        )}

        <TypingIndicator user={typingUser} />

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="flex-shrink-0">
        <ChatInput orderId={orderId} user={user} />
      </div>
    </div>
  )
}