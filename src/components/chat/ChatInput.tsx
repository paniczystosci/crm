// src/components/chat/ChatInput.tsx
'use client'

import { useRef, useState } from 'react'
import { sendMessage } from '@/lib/supabase/sendMessage'
import { sendTyping } from '@/lib/supabase/sendTyping'
import { useTranslations } from 'next-intl'
import { Send, Loader2, Paperclip, X } from 'lucide-react'

export function ChatInput({ orderId, user }: any) {
  const t = useTranslations('common')
  const chatT = useTranslations('chat')
  const errorsT = useTranslations('errors')
  
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || sending) return
    
    setSending(true)
    
    try {
      const result = await sendMessage(orderId, user.id, text, selectedFile || undefined)
      
      if (result.success) {
        setText('')
        setSelectedFile(null)
        if (fileRef.current) fileRef.current.value = ''
      } else {
        console.error('Failed to send message:', result.error)
        alert(errorsT('serverError'))
      }
    } catch (error) {
      console.error('Error in handleSend:', error)
      alert(errorsT('serverError'))
    } finally {
      setSending(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(chatT('selectImage'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(chatT('imageSizeLimit'))
      return
    }

    setSelectedFile(file)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
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
      sendTyping(orderId, user.full_name).catch(console.error)
    }
  }

  return (
    <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Preview selected file */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip size={14} className="text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
              {selectedFile.name}
            </span>
          </div>
          <button
            onClick={removeSelectedFile}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2">
        
        {/* Кнопка прикрепить изображение */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || sending}
          className="flex-shrink-0 p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title={chatT('attachImage')}
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
            placeholder={chatT('placeholder')}
            rows={1}
            disabled={sending}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200 resize-none disabled:opacity-50"
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
          disabled={(!text.trim() && !selectedFile) || sending}
          className={`flex-shrink-0 p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${
            (text.trim() || selectedFile) && !sending
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg transform active:scale-95'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={chatT('send')}
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
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
          {sending ? t('loading') : (text.trim() || selectedFile) ? chatT('enterToSend') : chatT('enterHint')}
        </p>
        {text.length > 0 && (
          <p className="text-xs text-gray-400">
            {text.length} {chatT('characters')}
          </p>
        )}
      </div>
    </div>
  )
}