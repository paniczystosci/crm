// src/components/PushNotification.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function PushNotification() {
  const [isSupported, setIsSupported] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  
  const supabase = createClient()
  const t = useTranslations('common')
  const notificationsT = useTranslations('notifications')

  // Проверка статуса разрешения
  useEffect(() => {
    if ('Notification' in window) {
      const isDenied = Notification.permission === 'denied'
      setPermissionDenied(isDenied)
      
      if (isDenied) {
        setShowBanner(true)
      }
    }
  }, [])

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setIsSupported(false)
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      setIsSupported(false)
      return false
    }
  }

  const subscribeToPush = async () => {
    setLoading(true)
    
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert(notificationsT('browserNotSupported'))
        setLoading(false)
        return
      }

      if (permissionDenied) {
        alert(notificationsT('blockedHelp'))
        setLoading(false)
        return
      }

      // Запрашиваем разрешение
      let permission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          setPermissionDenied(true)
          setShowBanner(true)
        }
        alert(notificationsT('permissionRequired'))
        setLoading(false)
        return
      }

      const registration = await registerServiceWorker()
      if (!registration) {
        setLoading(false)
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        alert(notificationsT('notConfigured'))
        setLoading(false)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: JSON.stringify(subscription),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        setIsSubscribed(true)
        setShowBanner(false)
        alert(notificationsT('enabled'))
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert(notificationsT('enableError'))
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setLoading(true)
    
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
        }
        
        setIsSubscribed(false)
        alert(notificationsT('disabled'))
      }
    } catch (error) {
      console.error('Unsubscription error:', error)
      alert(notificationsT('disableError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator)) return
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    }
    
    registerServiceWorker()
    checkSubscription()
  }, [])

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Баннер для заблокированных уведомлений */}
      {showBanner && permissionDenied && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {notificationsT('blocked')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {notificationsT('blockedHelp')}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
        disabled={loading || permissionDenied}
        className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
          isSubscribed
            ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        } ${permissionDenied ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={permissionDenied ? notificationsT('blocked') : (isSubscribed ? notificationsT('disable') : notificationsT('enable'))}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isSubscribed ? (
          <Bell size={18} className="fill-current" />
        ) : (
          <BellOff size={18} />
        )}
        <span className="text-sm hidden sm:inline">
          {loading ? t('loading') : (isSubscribed ? notificationsT('on') : notificationsT('off'))}
        </span>
      </button>
    </>
  )
}