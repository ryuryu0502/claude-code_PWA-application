import React from 'react'
import { useAuth } from '../../hooks/useAuth'

const LoginForm: React.FC = () => {
  const { signInWithGoogle, signInWithTwitter } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('ログインエラー:', error)
    }
  }

  const handleTwitterLogin = async () => {
    try {
      await signInWithTwitter()
    } catch (error) {
      console.error('ログインエラー:', error)
    }
  }

  return (
    <div className="login-form">
      <h2>ログイン（オプション）</h2>
      <div className="login-buttons">
        <button onClick={handleGoogleLogin} className="btn btn-secondary google-login">
          <span>🔍</span>
          Googleでログイン
        </button>
        <button onClick={handleTwitterLogin} className="btn btn-secondary twitter-login">
          <span>🐦</span>
          Xでログイン
        </button>
      </div>
    </div>
  )
}

export default LoginForm