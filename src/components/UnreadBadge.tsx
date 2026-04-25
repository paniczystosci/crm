// src/components/UnreadBadge.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getUnreadCount } from '@/lib/supabase/markMessagesAsRead'
import { MessageCircle } from 'lucide-react'

type UnreadBadgeProps = {
  orderId: string
  userId?: string
}

export function UnreadBadge({ orderId, userId }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadUnreadCount = async () => {
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        currentUserId = user?.id
      }
      if (!currentUserId || !isMounted) return

      const count = await getUnreadCount(orderId, currentUserId)
      if (isMounted) setUnreadCount(count)
    }

    loadUnreadCount()

    // Подписка на новые сообщения
    const channel = supabase
      .channel(`unread-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [orderId, userId, supabase])

  if (unreadCount === 0) return null

  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-pulse z-10">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  )
}