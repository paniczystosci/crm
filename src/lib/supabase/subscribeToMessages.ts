import { SubscribeParams } from '@/types/chat'

export function subscribeToMessages({
  supabase,
  orderId,
  onMessage,
  onTyping
}: SubscribeParams) {
  const channel = supabase
    .channel(`order_chat_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`
      },
      (payload: any) => onMessage(payload.new)
    )
    .on(
      'broadcast',
      { event: 'typing' },
      (payload: any) => onTyping(payload.payload)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
