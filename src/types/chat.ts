export type ChatMessage = {
  id: string
  order_id: string
  author_id: string
  message: string | null
  image_url?: string | null
  created_at: string
  author_avatar?: string | null
}

export type SubscribeParams = {
  supabase: any
  orderId: string
  onMessage: (msg: ChatMessage) => void
  onTyping: (data: { user: string }) => void
}
