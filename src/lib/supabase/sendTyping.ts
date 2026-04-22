// src/lib/supabase/sendTyping.ts
import { createClient } from '@/lib/supabase'

export async function sendTyping(orderId: string, userName: string) {
  const supabase = createClient()
  
  const channel = supabase.channel(`order_messages:${orderId}`)
  
  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user: userName }
  })
}