// src/components/chat/ChatInput.tsx
'use client'

import { useRef, useState } from 'react'
import { sendMessage } from '@/lib/supabase/sendMessage'
import { sendTyping } from '@/lib/supabase/sendTyping'
import { Send, Loader2, Paperclip, Image as ImageIcon } from 'lucide-react'

export function ChatInput({ orderId, user }: any) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!text.trim() || uploading) return
    await sendMessage(orderId, user.id, text)
    setText('')
  }

  const handleFile = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    await sendMessage(orderId, user.id, null, file)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTyping = () => {
    if (user?.full_name) {
      sendTyping(orderId, user.full_name)
    }
  }

  return (
    <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-end gap-1.5 sm:gap-2">
        
        {/* Кнопка прикрепить изображение */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Прикрепить изображение"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        {/* Поле ввода */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              handleTyping()
            }}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Напишите сообщение..."
            rows={1}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200 resize-none"
            style={{
              borderColor: isFocused ? '#10b981' : '#e5e7eb',
              minHeight: '40px',
              maxHeight: '100px'
            }}
          />
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          className={`flex-shrink-0 p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${
            text.trim() && !uploading
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg transform active:scale-95'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title="Отправить сообщение"
        >
          <Send size={18} />
        </button>

        {/* Скрытый input для файлов */}
        <input
          type="file"
          ref={fileRef}
          onChange={handleFile}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* Подсказка */}
      <div className="flex justify-between items-center mt-2 px-1">
        <p className="text-xs text-gray-400">
          {text.trim() && !uploading ? '↵ Enter для отправки' : 'Enter — отправить'}
        </p>
        {text.length > 0 && (
          <p className="text-xs text-gray-400">
            {text.length} симв.
          </p>
        )}
      </div>
    </div>
  )
}