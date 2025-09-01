import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useHostStore } from '../stores/hostStore'
import { campaignService, Campaign } from '../services/campaignService'

const HostDashboard: React.FC = () => {
  const { user } = useAuth()
  const { hostProfile, isHost } = useHostStore()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleStatusChange = async (campaignId: string, currentStatus: string) => {
    try {
      let newStatus: 'draft' | 'active' | 'ended' | 'completed'
      
      if (currentStatus === 'draft') {
        newStatus = 'active'
      } else if (currentStatus === 'active') {
        newStatus = 'ended'
      } else {
        return
      }
      
      await campaignService.updateCampaignStatus(campaignId, newStatus)
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  useEffect(() => {
    if (!user || !isHost) {
      navigate('/settings')
      return
    }

    const unsubscribe = campaignService.subscribeToCampaigns(
      (campaigns) => setCampaigns(campaigns),
      user.uid
    )

    return () => unsubscribe()
  }, [user, isHost, navigate])

  if (!isHost || !hostProfile) {
    return (
      <div className="host-dashboard">
        <h1>アクセス権限がありません</h1>
        <p>ホストとしてログインしてください</p>
        <button onClick={() => navigate('/settings')} className="btn btn-primary">
          設定に戻る
        </button>
      </div>
    )
  }

  return (
    <div className="host-dashboard">
      <div className="dashboard-header">
        <h1>🎯 ホストダッシュボード</h1>
        <p>ようこそ、{hostProfile.name}さん</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>作成した企画</h3>
          <p className="stat-number">{campaigns.length}</p>
        </div>
        <div className="stat-card">
          <h3>総参加者数</h3>
          <p className="stat-number">
            {campaigns.reduce((sum, c) => sum + c.participants.length, 0)}
          </p>
        </div>
        <div className="stat-card">
          <h3>アクティブ企画</h3>
          <p className="stat-number">
            {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary create-campaign-btn"
        >
          <span>🎁</span>
          新しい企画を作成
        </button>
      </div>

      <div className="campaigns-section">
        <h2>企画一覧</h2>
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <p>まだ企画がありません</p>
            <p>新しい企画を作成してみましょう！</p>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-header">
                  <h3>{campaign.title}</h3>
                  <span className={`status-badge ${campaign.status}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="campaign-description">{campaign.description}</p>
                <div className="campaign-stats">
                  <span>🎁 {campaign.prize}</span>
                  <span>👥 {campaign.participants.length}人参加</span>
                </div>
                <div className="campaign-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange(campaign.id, campaign.status)}
                  >
                    {campaign.status === 'draft' ? 'アクティブ化' : 
                     campaign.status === 'active' ? '終了' : '完了済み'}
                  </button>
                  <button className="btn btn-ghost">詳細</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <CampaignCreateModal 
          onClose={() => setShowCreateForm(false)}
          hostId={user!.uid}
          hostName={hostProfile.name}
        />
      )}
    </div>
  )
}

const CampaignCreateModal: React.FC<{
  onClose: () => void
  hostId: string
  hostName: string
}> = ({ onClose, hostId, hostName }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prize, setPrize] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const campaignId = await campaignService.createCampaign({
        title,
        description,
        prize,
        hostId,
        hostName,
        startDate: new Date(),
        endDate: new Date(endDate),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        status: 'draft'
      })

      // 参加リンク生成
      const baseUrl = window.location.origin
      const link = `${baseUrl}/register?ref=${campaignId}&campaign=${encodeURIComponent(title)}`
      setGeneratedLink(link)

    } catch (error) {
      console.error('企画作成エラー:', error)
      alert('企画の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      alert('リンクをコピーしました！')
    } catch (error) {
      console.error('コピーエラー:', error)
    }
  }

  if (generatedLink) {
    return (
      <div className="modal">
        <div className="modal-content campaign-success">
          <h2>🎉 企画が作成されました！</h2>
          
          <div className="generated-link-section">
            <h3>📎 参加リンク</h3>
            <div className="link-display">
              <input 
                type="text" 
                value={generatedLink} 
                readOnly 
                className="link-input"
              />
              <button onClick={copyLink} className="btn btn-secondary copy-btn">
                📋 コピー
              </button>
            </div>
            <p className="link-help">
              このリンクをXで共有して、ユーザーに企画への参加を促しましょう！
            </p>
          </div>

          <div className="next-steps">
            <h3>📋 次のステップ</h3>
            <ol>
              <li>上記リンクをコピー</li>
              <li>Xで企画内容と一緒に投稿</li>
              <li>企画を「アクティブ」に変更</li>
              <li>参加者の反応を確認</li>
            </ol>
          </div>

          <button onClick={onClose} className="btn btn-primary">
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal">
      <div className="modal-content campaign-create">
        <div className="modal-header">
          <h2>🎁 新しい企画を作成</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleCreate} className="campaign-form">
          <div className="form-group">
            <label className="form-label">企画タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: Nintendo Switch プレゼント企画"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">企画説明 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="企画の詳細や参加条件を記載してください"
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">プレゼント内容 *</label>
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="例: Nintendo Switch 1台"
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">終了日時 *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">最大参加者数</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="無制限"
                className="form-input"
                min="1"
              />
            </div>
          </div>

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
              disabled={isLoading}
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? '作成中...' : '企画を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HostDashboard