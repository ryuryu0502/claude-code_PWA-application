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
    <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">ログイン（オプション）</h2>
      
      <form onSubmit={handleEmailAuth} className="space-y-6">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          {isSignUp ? '新規登録' : 'ログイン'}
        </button>
        
        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-gray-400 hover:text-white text-sm"
        >
          {isSignUp ? 'ログインに切り替え' : '新規登録に切り替え'}
        </button>
      </form>
      
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400">または</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>
      
      <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center bg-white text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-200 transition duration-300">
        <span className="mr-2">🔍</span>
        Googleでログイン
      </button>
    </div>
  )
}

export default LoginForm
