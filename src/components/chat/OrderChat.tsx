// src/components/OrderChat.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

import { MessageBubble } from './MessageBubble'
import { MessageGroup } from './MessageGroup'
import { TypingIndicator } from './TypingIndicator'
import { ChatInput } from './ChatInput'
import { subscribeToMessages } from '@/lib/supabase/subscribeToMessages'
import { MessageCircle, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

  const typingTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // Загружаем пользователя
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    loadUser()
  }, [])

  // Загружаем сообщения + подписка
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToMessages({
      supabase,
      orderId,
      onMessage: msg => {
        setMessages(prev => [...prev, msg])
        scrollToBottom()
      },
      onTyping: payload => {
        setTypingUser(payload.user)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 1500)
      }
    })

    // Первичная загрузка
    const load = async () => {
      const { data } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      scrollToBottom()
    }

    load()

    return () => unsubscribe()
  }, [user, orderId])

  // Группировка сообщений по датам
  const groups = messages.reduce((acc: any, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('ru-RU')
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})

  if (!user) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="text-gray-400 text-sm">{t('loading')}</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[500px] sm:h-[550px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      
      {/* Заголовок - фиксированный, не скроллится */}
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

      {/* Сообщения - скроллится */}
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

      {/* Поле ввода - фиксированное внизу */}
      <div className="flex-shrink-0">
        <ChatInput orderId={orderId} user={user} />
      </div>
    </div>
  )
}