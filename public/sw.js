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

function log(level) {
  var args = Array.prototype.slice.call(arguments, 1)
  var prefix = '[SW]'
  if (level === 'error') {
    console.error(prefix, args.join(' '))
  } else if (level === 'warn') {
    console.warn(prefix, args.join(' '))
  } else {
    console.log(prefix, args.join(' '))
  }
}

function shouldCache(request) {
  var url = new URL(request.url)
  
  if (
    url.pathname.includes('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('analytics') ||
    url.pathname.includes('_next/') ||
    request.method !== 'GET'
  ) {
    return false
  }
  
  return url.hostname === self.location.hostname
}

// Установка
self.addEventListener('install', function (event) {
  log('info', 'Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return Promise.all(
        STATIC_ASSETS.map(function (asset) {
          return cache.add(asset).catch(function (err) {
            log('warn', 'Failed to cache ' + asset + ':', err)
          })
        })
      )
    }).then(function () {
      log('info', 'Static assets cached')
      return self.skipWaiting()
    })
  )
})

// Активация
self.addEventListener('activate', function (event) {
  log('info', 'Activating...')
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            log('info', 'Deleting old cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(function () {
      log('info', 'Activated')
      return self.clients.claim()
    })
  )
})

// Fetch
self.addEventListener('fetch', function (event) {
  var request = event.request
  
  if (!shouldCache(request)) {
    return
  }
  
// Обработка навигации (переход по страницам)
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match('/offline.html')
    })
  )
  return
}
  
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse
      }
      
      return fetch(request, { redirect: 'follow' })
        .then(function (networkResponse) {
          if (networkResponse.status === 200) {
            var responseClone = networkResponse.clone()
            caches.open(DYNAMIC_CACHE).then(function (cache) {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
        .catch(function () {
          if (request.destination === 'image') {
            return new Response(
              'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              { status: 200, headers: { 'Content-Type': 'image/gif' } }
            )
          }
          return new Response('Network error', { status: 503 })
        })
    })
  )
})

// Push
self.addEventListener('push', function (event) {
  var data = {}
  
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    data = {
      title: 'CRM Cleaning',
      body: 'Новое уведомление',
      url: '/dashboard'
    }
  }
  
  var options = {
    body: data.body || 'У вас новое уведомление',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.orderId || 'default',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/dashboard',
      orderId: data.orderId
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'CRM Cleaning',
      options
    )
  )
})

// Notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  
  if (event.action === 'close') return
  
  var url = event.notification.data.url || '/dashboard'
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i]
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// Messages
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(STATIC_CACHE),
        caches.delete(DYNAMIC_CACHE)
      ]).then(function () {
        self.clients.matchAll().then(function (clients) {
          clients.forEach(function (client) {
            client.postMessage({ type: 'CACHE_CLEARED' })
          })
        })
      })
    )
  }
})