'use client'

import { useRef, useState } from 'react'
import { sendMessage } from '@/lib/supabase/sendMessage'
import { sendTyping } from '@/lib/supabase/sendTyping'
import { Image as ImageIcon, Send, Loader2 } from 'lucide-react'

export function ChatInput({ orderId, user }: any) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!text.trim()) return
    await sendMessage(orderId, user.id, text)
    setText('')
  }

  const handleFile = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    await sendMessage(orderId, user.id, null, file)
    setUploading(false)
  }

  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => {
            setText(e.target.value)
            if (user?.full_name) sendTyping(orderId, user.full_name)
          }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Напишите сообщение…"
          className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
        </button>

        <button
          onClick={handleSend}
          className="px-6 bg-rose-600 text-white rounded-2xl"
        >
          <Send />
        </button>

        <input
          type="file"
          ref={fileRef}
          onChange={handleFile}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  )
}
