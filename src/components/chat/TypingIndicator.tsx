// src/components/chat/TypingIndicator.tsx
'use client'

import { useTranslations } from 'next-intl'

export function TypingIndicator({ user }: { user: string | null }) {
  const t = useTranslations('chat')
  
  if (!user) return null

  return (
    <div className="text-xs text-gray-500 px-4 pb-2 animate-pulse">
      {user} {t('typing')}
    </div>
  )
}