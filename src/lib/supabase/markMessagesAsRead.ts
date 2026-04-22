// src/lib/supabase/markMessagesAsRead.ts
import { createClient } from '@/lib/supabase'

export async function markMessagesAsRead(orderId: string, userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('order_chat_reads')
    .upsert({
      order_id: orderId,
      user_id: userId,
      last_read_at: new Date().toISOString()
    }, {
      onConflict: 'order_id, user_id'
    })
  
  if (error) {
    console.error('Error marking messages as read:', error)
  } else {
    console.log('✅ Messages marked as read for order:', orderId.slice(0, 8))
    // Триггерим обновление глобального счетчика
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refresh-unread'))
    }
  }
}

export async function getUnreadCount(orderId: string, userId: string) {
  const supabase = createClient()
  
  const { data: readData } = await supabase
    .from('order_chat_reads')
    .select('last_read_at')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .single()
  
  const lastReadAt = readData?.last_read_at || new Date(0).toISOString()
  
  const { count, error } = await supabase
    .from('order_messages')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .neq('user_id', userId)
    .gt('created_at', lastReadAt)
  
  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
  
  return count || 0
}