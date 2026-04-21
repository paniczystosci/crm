'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

import { MessageBubble } from './chat/MessageBubble'
import { MessageGroup } from './chat/MessageGroup'
import { TypingIndicator } from './chat/TypingIndicator'
import { ChatInput } from './chat/ChatInput'
import { subscribeToMessages } from '@/lib/supabase/subscribeToMessages'

type OrderChatProps = {
  orderId: string
  isAdmin?: boolean
}

export default function OrderChat({ orderId, isAdmin = false }: OrderChatProps) {

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

  if (!user) return <div className="p-6 text-center text-zinc-400">Загрузка…</div>

  return (
    <div className="flex flex-col height-[600px] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">

      {/* Заголовок */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="font-semibold">Чат по заказу</div>
        <div className="text-xs text-zinc-500">Вы и клинер</div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groups).map(([date, msgs]: any) => (
          <MessageGroup
            key={date}
            date={date}
            messages={msgs}
            userId={user.id}
          />
        ))}

        <TypingIndicator user={typingUser} />

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <ChatInput orderId={orderId} user={user} />
    </div>
  )
}
