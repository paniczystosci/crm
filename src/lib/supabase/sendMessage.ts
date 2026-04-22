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
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `chat-images/${orderId}/${fileName}`

        // Проверяем существует ли bucket
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(b => b.name === 'chat-images')
        
        if (!bucketExists) {
          console.error('Bucket "chat-images" does not exist')
          throw new Error('Storage bucket not configured')
        }

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
      } catch (uploadErr) {
        console.error('Upload failed:', uploadErr)
        throw new Error('Failed to upload image')
      }
    }

    // Сохраняем сообщение в базу
    const { data, error: insertError } = await supabase
      .from('order_messages')
      .insert({
        order_id: orderId,
        user_id: userId,
        message: message || null,
        image_url: image_url,
        created_at: new Date().toISOString()
      })
      .select()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      throw insertError
    }

    console.log('Message sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return { success: false, error }
  }
}