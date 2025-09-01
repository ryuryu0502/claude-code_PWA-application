importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: "AIzaSyDc9vbmzIqFAdYNkgDQFAKXibGBX3hqKS0",
  authDomain: "push-manager-2acdb.firebaseapp.com",
  projectId: "push-manager-2acdb",
  storageBucket: "push-manager-2acdb.firebasestorage.app",
  messagingSenderId: "236273826467",
  appId: "1:236273826467:web:0f57403d4d14fd1eb09d16"
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('バックグラウンドメッセージ受信:', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})