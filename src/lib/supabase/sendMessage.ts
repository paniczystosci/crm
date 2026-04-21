import { createClient } from '@/lib/supabase'

export async function sendMessage(
  orderId: string,
  userId: string,
  text: string | null,
  file?: File
) {
  const supabase = createClient()

  let imageUrl = null

  if (file) {
    const ext = file.name.split('.').pop()
    const name = `${Date.now()}.${ext}`
    const path = `order-images/${orderId}/${name}`

    await supabase.storage.from('order-images').upload(path, file)
    imageUrl = supabase.storage.from('order-images').getPublicUrl(path).data.publicUrl
  }

  await supabase.from('order_messages').insert({
    order_id: orderId,
    author_id: userId,
    message: text ?? 'Фото',
    image_url: imageUrl
  })
}
