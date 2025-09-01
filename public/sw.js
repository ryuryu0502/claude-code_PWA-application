const CACHE_NAME = 'present-app-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  const pendingActions = localStorage.getItem('pendingActions')
  if (pendingActions) {
    const actions = JSON.parse(pendingActions)
    for (const action of actions) {
      try {
        await fetch(action.url, action.options)
      } catch (error) {
        console.error('バックグラウンド同期エラー:', error)
      }
    }
    localStorage.removeItem('pendingActions')
  }
}