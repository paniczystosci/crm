// src/lib/supabase/playNotificationSound.ts
export function playNotificationSound() {
  // Проверяем, что код выполняется в браузере
  if (typeof window === 'undefined') return
  
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(e => {
      console.log('Audio play failed:', e)
      // Не показываем ошибку пользователю
    })
  } catch (error) {
    console.log('Audio not supported:', error)
  }
}