import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { notificationService } from '../../services/notificationService'

const NotificationBanner: React.FC = () => {
  const { user, profile } = useAuthStore()
  const [isEnabling, setIsEnabling] = useState(false)

  const enableNotifications = async () => {
    if (!user) return
    
    setIsEnabling(true)
    try {
      await notificationService.enableNotifications(user.uid)
    } catch (error) {
      console.error('通知有効化エラー:', error)
    } finally {
      setIsEnabling(false)
    }
  }

  if (!user || profile?.notificationEnabled) {
    return null
  }

  return (
    <div className="notification-banner">
      <p>通知を有効にしてください</p>
      <button 
        onClick={enableNotifications}
        disabled={isEnabling}
        className="enable-button"
      >
        {isEnabling ? '設定中...' : '有効にする'}
      </button>
    </div>
  )
}

export default NotificationBanner