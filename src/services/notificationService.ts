import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export class NotificationService {
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey
        })
        return token
      }
      return null
    } catch (error) {
      console.error('通知許可エラー:', error)
      return null
    }
  }

  async updateUserToken(userId: string, token: string) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        fcmToken: token,
        notificationEnabled: true
      })
    } catch (error) {
      console.error('トークン更新エラー:', error)
    }
  }

  setupMessageListener() {
    onMessage(messaging, (payload) => {
      console.log('メッセージ受信:', payload)
      
      if (payload.notification) {
        new Notification(payload.notification.title || '', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png'
        })
      }
    })
  }

  async enableNotifications(userId: string): Promise<boolean> {
    const token = await this.requestPermission()
    if (token) {
      await this.updateUserToken(userId, token)
      this.setupMessageListener()
      return true
    }
    return false
  }
}

export const notificationService = new NotificationService()