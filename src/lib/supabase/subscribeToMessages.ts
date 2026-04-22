// src/lib/supabase/subscribeToMessages.ts
import { RealtimeChannel } from '@supabase/supabase-js'

type SubscribeToMessagesProps = {
  supabase: any
  orderId: string
  onMessage: (message: any) => void
  onTyping?: (payload: any) => void
}

export function subscribeToMessages({ 
  supabase, 
  orderId, 
  onMessage, 
  onTyping 
}: SubscribeToMessagesProps): () => void {
  
  // Подписка на новые сообщения через Realtime
  const channel: RealtimeChannel = supabase
    .channel(`order_messages:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`,
      },
      (payload: { new: any }) => {
        console.log('New message received:', payload)
        onMessage(payload.new)
      }
    )
    .on('broadcast', { event: 'typing' }, (payload: { payload: any }) => {
      if (onTyping) {
        onTyping(payload.payload)
      }
    })
    .subscribe()

  // Возвращаем функцию отписки
  return () => {
    supabase.removeChannel(channel)
  }
}