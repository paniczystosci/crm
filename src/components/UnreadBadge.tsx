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
    let mounted = true

    const loadCount = async () => {
      let uid = userId
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser()
        uid = user?.id
      }
      if (!uid || !mounted) return

      const count = await getUnreadCount(orderId, uid)
      if (mounted) setUnreadCount(count)
    }

    loadCount()

    const channel = supabase
      .channel(`unread-badge-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'order_messages',
          filter: `order_id=eq.${orderId}` 
        },
        loadCount
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [orderId, userId, supabase])

  if (unreadCount <= 0) return null

  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-5 px-1.5 flex items-center justify-center shadow">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  )
}