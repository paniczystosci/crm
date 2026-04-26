// src/app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import webpush from 'web-push'

// Настройка web-push
webpush.setVapidDetails(
  'mailto:admin@crm-cleaning.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url, orderId } = await req.json()
    
    const supabase = await createClient()
    
    // Получаем все подписки пользователя
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'No subscriptions found' })
    }
    
    // Отправляем уведомление на все подписки
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscription = JSON.parse(sub.subscription)
        const payload = JSON.stringify({
          title,
          body,
          url: `${process.env.NEXT_PUBLIC_APP_URL}${url}`,
          orderId,
          timestamp: Date.now()
        })
        
        return webpush.sendNotification(subscription, payload)
      })
    )
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    return NextResponse.json({ 
      success: true, 
      sent: successCount,
      total: subscriptions.length
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send notification' })
  }
}