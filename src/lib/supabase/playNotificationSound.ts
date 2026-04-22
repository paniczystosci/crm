// src/lib/supabase/playNotificationSound.ts
export function playNotificationSound() {
  if (typeof window === 'undefined') return
  
  try {
    // Вариант 1: Используем Web Audio API для создания простого звука
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    gainNode.gain.value = 0.2
    
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    // Возобновляем аудио контекст если он приостановлен
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  } catch (error) {
    console.log('Web Audio API error:', error)
    
    // Вариант 2: Пробуем использовать HTML5 Audio
    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,U3RlYWx0aCBpcyBhIHJlY29yZCBvZiB0aGUgZGV2ZWxvcG1lbnQgb2YgdGhlIGF1ZGlvIHN5c3RlbSB0aGF0IGFsbG93cyBmb3IgdGhlIGNyZWF0aW9uIG9mIHNvdW5kcyBpbiB0aGUgY29tcHV0ZXIgZW52aXJvbm1lbnQu'
      audio.volume = 0.3
      audio.play().catch(e => console.log('Fallback audio failed:', e))
    } catch (e) {
      console.log('No audio support')
    }
  }
}