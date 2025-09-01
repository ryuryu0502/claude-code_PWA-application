import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const LoginForm: React.FC = () => {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="login-form">
      <h2>ログイン（オプション）</h2>
      
      <form onSubmit={handleEmailAuth} className="email-form">
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="form-input"
            required
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="btn btn-primary email-submit">
          {isSignUp ? '新規登録' : 'ログイン'}
        </button>
        
        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="btn btn-ghost toggle-mode"
        >
          {isSignUp ? 'ログインに切り替え' : '新規登録に切り替え'}
        </button>
      </form>
      
      <div className="divider-mini">
        <span>または</span>
      </div>
      
      <button onClick={handleGoogleLogin} className="btn btn-secondary google-login">
        <span>🔍</span>
        Googleでログイン
      </button>
    </div>
  )
}

export default LoginForm