import React from 'react'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/Auth/LoginForm'
import InstallInstructions from '../components/Auth/InstallInstructions'
import NotificationBanner from '../components/Common/NotificationBanner'

const Register: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return (
      <div className="register-page">
        <InstallInstructions />
        <NotificationBanner />
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="welcome-section">
        <h1>プレゼント企画アプリ</h1>
        <p>プレゼント企画に参加しよう！</p>
      </div>
      
      <div className="auth-options">
        <div className="guest-access">
          <button className="btn btn-primary guest-button">
            <span>🎁</span>
            ゲストとして続行
          </button>
          <p className="guest-note">※ログインなしでもご利用いただけます</p>
        </div>
        
        <div className="divider">
          <span>または</span>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
}

export default Register