import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../stores/authStore'
import { notificationService } from '../services/notificationService'
import ProfileForm from '../components/Profile/ProfileForm'

const Settings: React.FC = () => {
  const { signOut, user } = useAuth()
  const { profile, updateProfile } = useAuthStore()
  const [showHostLogin, setShowHostLogin] = useState(false)
  const [testStatus, setTestStatus] = useState<string>('')

  const toggleNotifications = async () => {
    if (!profile) return
    await updateProfile({
      notificationEnabled: !profile.notificationEnabled
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleHostLogin = () => {
    setShowHostLogin(true)
  }

  const testPushNotification = async () => {
    if (!user) {
      setTestStatus('ログインが必要です')
      return
    }

    try {
      setTestStatus('通知テストを準備中...')
      
      const success = await notificationService.enableNotifications(user.uid)
      if (!success) {
        setTestStatus('通知権限が必要です')
        return
      }

      setTestStatus('20秒後にテスト通知を送信します...')
      
      setTimeout(() => {
        if ('serviceWorker' in navigator && 'Notification' in window) {
          new Notification('🎁 テスト通知', {
            body: 'プッシュ通知のテストです！正常に動作しています。',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'test-notification',
            requireInteraction: false,
            vibrate: [200, 100, 200]
          })
          setTestStatus('✅ テスト通知を送信しました！')
        } else {
          setTestStatus('❌ 通知がサポートされていません')
        }
      }, 20000)
      
    } catch (error) {
      console.error('通知テストエラー:', error)
      setTestStatus('❌ 通知テストに失敗しました')
    }
  }

  return (
    <div className="settings-page">
      <h1>設定</h1>
      
      <ProfileForm />
      
      <div className="settings-section">
        <h2>通知設定</h2>
        <div className="setting-item">
          <span>プッシュ通知</span>
          <button 
            onClick={toggleNotifications}
            className={`toggle ${profile?.notificationEnabled ? 'on' : 'off'}`}
          >
            {profile?.notificationEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="setting-item">
          <div className="test-notification">
            <button 
              onClick={testPushNotification}
              className="btn btn-secondary test-button"
              disabled={!!testStatus && testStatus.includes('秒後')}
            >
              🔔 プッシュ通知テスト
            </button>
            {testStatus && (
              <p className="test-status">{testStatus}</p>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>アプリ管理</h2>
        <div className="setting-item">
          <button onClick={handleHostLogin} className="host-login-button">
            ホストログイン
          </button>
        </div>
        
        <div className="uninstall-info">
          <h3>アンインストール方法</h3>
          <p><strong>Android:</strong> ホーム画面のアイコンを長押し → アンインストール</p>
          <p><strong>iPhone:</strong> ホーム画面のアイコンを長押し → アプリを削除</p>
        </div>
      </div>

      {user && (
        <div className="settings-section">
          <h2>アカウント</h2>
          <div className="setting-item">
            <span>ログイン中: {user.email || user.displayName}</span>
          </div>
          <button onClick={handleSignOut} className="btn btn-secondary logout-button">
            ログアウト
          </button>
        </div>
      )}

      {showHostLogin && (
        <div className="modal">
          <div className="modal-content">
            <h3>ホストログイン</h3>
            <p>ホスト機能は管理者専用です。</p>
            <button onClick={() => setShowHostLogin(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings