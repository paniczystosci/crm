// src/components/chat/MessageBubble.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Image, Download, User } from 'lucide-react'

export function MessageBubble({ msg, isMine }: any) {
  const t = useTranslations('chat')
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageClick = () => {
    window.open(msg.image_url, '_blank')
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      
      {/* Аватар (только для чужих сообщений) */}
      {!isMine && (
        <div className="flex-shrink-0">
          {msg.author_avatar ? (
            <img
              src={msg.author_avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
              <User size={16} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Сообщение */}
      <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-2'}`}>
        
        {/* Имя отправителя (для групповых чатов) */}
        {!isMine && msg.author_name && (
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-2">
            {msg.author_name}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isMine
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
          }`}
        >
          {/* Текст сообщения */}
          {msg.message && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {msg.message}
            </p>
          )}

          {/* Изображение */}
          {msg.image_url && (
            <div className="mt-2 group relative">
              <div 
                className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                  !imageLoaded ? 'bg-gray-200 dark:bg-gray-600 animate-pulse' : ''
                }`}
                onClick={handleImageClick}
              >
                <img
                  src={msg.image_url}
                  alt="Изображение"
                  className={`max-h-64 w-auto object-cover transition-opacity duration-200 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black/50 rounded-full p-2">
                      <Image size={20} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.open(msg.image_url, '_blank')}
                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 rounded-lg p-1.5 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Download size={14} className="text-white" />
              </button>
            </div>
          )}

          {/* Время */}
          <div className={`text-[10px] mt-1.5 ${isMine ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(msg.created_at)}
            {msg.is_edited && (
              <span className="ml-1 text-[9px] opacity-70">({t('edited')})</span>
            )}
          </div>
        </div>
      </div>

      {/* Аватар для своих сообщений (опционально, для зеркального отображения) */}
      {isMine && (
        <div className="flex-shrink-0 opacity-0 w-8">
          {/* Placeholder для сохранения отступов */}
        </div>
      )}
    </div>
  )
}