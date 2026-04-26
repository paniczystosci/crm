// public/sw.js
const CACHE_NAME = 'crm-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/offline.html'
]

// ✅ Только ОДИН обработчик install
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Пробуем добавить все ассеты, но не проваливаемся при ошибке
      await Promise.allSettled(
        STATIC_ASSETS.map(asset => 
          cache.add(asset).catch(err => 
            console.warn(`Failed to cache ${asset}:`, err)
          )
        )
      )
      console.log('Static assets cached')
    })
  )
  self.skipWaiting()
})

// ✅ Только ОДИН обработчик activate
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    Promise.all([
      // Очистка старых кэшей
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', key)
              return caches.delete(key)
            }
          })
        )
      }),
      // Захват контроля
      clients.claim()
    ])
  )
  console.log('Service Worker activated')
})

// ✅ ИСПРАВЛЕННЫЙ обработчик fetch
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Пропускаем API запросы
  if (request.url.includes('/api/') || 
      request.url.includes('supabase.co') ||
      request.url.includes('analytics') ||
      request.url.includes('_next/')) { // Добавлено _next
    return
  }
  
  // Для HTML страниц используем стратегию "сеть-с-падающим-в-кэш"
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { redirect: 'follow' }) // 👈 КЛЮЧЕВОЕ: добавляем redirect
        .catch(async () => {
          // Если сеть недоступна, показываем offline.html
          const cachedOffline = await caches.match('/offline.html')
          return cachedOffline || new Response('Offline', { status: 503 })
        })
    )
    return
  }
  
  // Для статических ресурсов используем кэш
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      
      // Запрос в сеть с правильной обработкой redirect
      return fetch(request, { redirect: 'follow' }) // 👈 Добавлено везде
        .then((networkResponse) => {
          // Кэшируем только успешные GET запросы
          if (request.method === 'GET' && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache).catch(err => {
                console.warn('Failed to cache:', request.url, err)
              })
            })
          }
          return networkResponse
        })
        .catch((error) => {
          console.warn('Fetch failed:', request.url, error)
          // Возвращаем заглушку для некритичных ресурсов
          if (request.destination === 'image') {
            return new Response('Image not available', { status: 404 })
          }
          return new Response('Network error', { status: 503 })
        })
    })
  )
})

// ✅ Только ОДИН обработчик push
self.addEventListener('push', (event) => {
  console.log('Push notification received')
  let data = {}
  
  try {
    data = event.data?.json() || {}
  } catch (e) {
    data = { title: 'Новое уведомление', body: 'У вас новое событие' }
  }
  
  const options = {
    body: data.body || 'У вас новое уведомление',
    icon: '/logo.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      orderId: data.orderId
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CRM Cleaning', options)
  )
})

// ✅ Только ОДИН обработчик notificationclick
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/dashboard'
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Если есть открытое окно, фокусируем его
          for (let client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus()
            }
          }
          // Иначе открываем новое
          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
})