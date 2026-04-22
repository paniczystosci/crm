// src/lib/supabase/playNotificationSound.ts
export function playNotificationSound() {
  if (typeof window === 'undefined') return
  
  try {
    // Пробуем использовать Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContext) {
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
      
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      return
    }
    
    // Fallback на HTML5 Audio
    const audio = new Audio()
    audio.src = '/notification.mp3'
    audio.volume = 0.3
    audio.play().catch(e => console.log('Audio fallback failed:', e))
  } catch (error) {
    console.log('Audio error:', error)
  }
}