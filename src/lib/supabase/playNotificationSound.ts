// src/lib/supabase/playNotificationSound.ts
export function playNotificationSound() {
  if (typeof window === 'undefined') return
  
  try {
    // Создаем новый Audio контекст каждый раз
    const audio = new Audio()
    
    // Используем Web Audio API для создания звука если нет файла
    audio.src = 'data:audio/wav;base64,U3RlYWx0aCBpcyBhIHJlY29yZCBvZiB0aGUgZGV2ZWxvcG1lbnQgb2YgdGhlIGF1ZGlvIHN5c3RlbSB0aGF0IGFsbG93cyBmb3IgdGhlIGNyZWF0aW9uIG9mIHNvdW5kcyBpbiB0aGUgY29tcHV0ZXIgZW52aXJvbm1lbnQu'
    audio.volume = 0.3
    
    // Пробуем воспроизвести
    const playPromise = audio.play()
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Audio play failed:', error)
        // Пробуем альтернативный способ
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContext) {
            const ctx = new AudioContext()
            const oscillator = ctx.createOscillator()
            const gain = ctx.createGain()
            
            oscillator.connect(gain)
            gain.connect(ctx.destination)
            
            oscillator.frequency.value = 800
            gain.gain.value = 0.2
            
            oscillator.start()
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
            oscillator.stop(ctx.currentTime + 0.5)
            
            if (ctx.state === 'suspended') {
              ctx.resume()
            }
          }
        } catch (e) {
          console.log('Web Audio API failed:', e)
        }
      })
    }
  } catch (error) {
    console.log('Audio error:', error)
  }
}