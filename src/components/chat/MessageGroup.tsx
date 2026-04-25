// src/components/chat/MessageGroup.tsx
'use client'

import { useTranslations } from 'next-intl'
import { MessageBubble } from './MessageBubble'

type MessageGroupProps = {
  date: string
  messages: any[]
  userId: string
}

export function MessageGroup({ date, messages, userId }: MessageGroupProps) {
  const t = useTranslations('chat')
  
  // Форматирование даты для отображения
  const formatDate = (dateStr: string) => {
    const today = new Date()
    const messageDate = new Date(dateStr)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return t('today')
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return t('yesterday')
    }
    
    return messageDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="space-y-3">
      {/* Разделитель даты */}
      <div className="flex justify-center my-4">
        <div className="px-3 py-1.5 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full shadow-sm">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {formatDate(date)}
          </span>
        </div>
      </div>

      {/* Сообщения */}
      <div className="space-y-2">
        {messages.map((msg: any, idx: number) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.user_id === userId}
            showAvatar={idx === messages.length - 1 || messages[idx + 1]?.user_id !== msg.user_id}
          />
        ))}
      </div>
    </div>
  )
}