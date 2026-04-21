import { createClient } from '@/lib/supabase'

export function sendTyping(orderId: string, user: string) {
  const supabase = createClient()

  supabase.channel(`order_chat_${orderId}`).send({
    type: 'broadcast',
    event: 'typing',
    payload: { user }
  })
}
