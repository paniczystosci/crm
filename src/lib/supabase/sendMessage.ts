// src/lib/supabase/sendMessage.ts
import { createClient } from '@/lib/supabase'

export async function sendMessage(
  orderId: string, 
  userId: string, 
  message: string | null, 
  file?: File
) {
  const supabase = createClient()

  try {
    let image_url = null

    // Если есть файл, загружаем его в Storage
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `chat-images/${orderId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      image_url = publicUrl
    }

    // Сохраняем сообщение в базу
    const { error: insertError } = await supabase
      .from('order_messages')
      .insert({
        order_id: orderId,
        user_id: userId,
        message: message || null,
        image_url: image_url,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error sending message:', insertError)
      throw insertError
    }

    return { success: true }
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return { success: false, error }
  }
}