import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHostStore } from '../../stores/hostStore'

interface HostLoginProps {
  onClose: () => void
  onSuccess: () => void
}

const HostLogin: React.FC<HostLoginProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const { createHostProfile } = useHostStore()
  const [hostName, setHostName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleBecomeHost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('まずユーザーログインが必要です')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await createHostProfile(user.uid, {
        name: hostName.trim() || user.displayName || 'ホスト',
        email: user.email || '',
        avatar: user.photoURL || ''
      })

      onSuccess()
    } catch (error: any) {
      setError('ホスト登録に失敗しました: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal">
      <div className="modal-content host-login-modal">
        <div className="modal-header">
          <h2>🎯 ホストになる</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleBecomeHost} className="host-login-form">
          <div className="form-group">
            <label className="form-label">ホスト名</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="ホスト名を入力"
              className="form-input"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-ghost"
            >
              キャンセル
            </button>
            <button 
              type="submit"
              disabled={isLoading || !hostName}
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? '登録中...' : 'ホストになる'}
            </button>
          </div>
        </form>

        <div className="host-info">
          <h3>ホストになると？</h3>
          <ul>
            <li>🎁 プレゼント企画を作成・管理</li>
            <li>📢 参加者への一斉通知</li>
            <li>📊 企画の統計データ確認</li>
            <li>🎯 抽選の実行・管理</li>
          </ul>
          <p className="host-note">
            誰でも無料でホストになれます！
          </p>
        </div>
      </div>
    </div>
  )
}

export default HostLogin