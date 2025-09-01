import React, { useState, useEffect } from 'react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3秒後に表示

      return () => clearTimeout(timer)
    }
  }, [isInstallable, dismissed, isInstalled])

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  const handleLater = () => {
    setShowPrompt(false)
    // 1時間後に再表示
    setTimeout(() => {
      setDismissed(false)
    }, 3600000)
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <div className="install-prompt-header">
          <h3>🎁 アプリをインストール</h3>
          <button onClick={handleDismiss} className="close-button">
            ×
          </button>
        </div>
        
        <div className="install-prompt-content">
          <div className="install-icon">📱</div>
          <p>ホーム画面に追加して、いつでも素早くアクセス！</p>
          
          <ul className="install-benefits-mini">
            <li>🚀 高速起動</li>
            <li>📢 プッシュ通知</li>
            <li>📶 オフライン対応</li>
          </ul>
        </div>
        
        <div className="install-prompt-actions">
          <button onClick={handleLater} className="btn btn-ghost later-button">
            後で
          </button>
          <button onClick={handleInstall} className="btn btn-primary install-button">
            インストール
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt