import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../stores/authStore'
import ProfileForm from '../components/Profile/ProfileForm'

const Settings: React.FC = () => {
  const { signOut, user } = useAuth()
  const { profile, updateProfile } = useAuthStore()
  const [showHostLogin, setShowHostLogin] = useState(false)

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

      <div className="settings-section">
        <button onClick={handleSignOut} className="logout-button">
          ログアウト
        </button>
      </div>

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