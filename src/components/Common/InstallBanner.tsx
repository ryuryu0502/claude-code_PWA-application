import React, { useState } from 'react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt()
  const [isVisible, setIsVisible] = useState(true)

  const handleInstall = async () => {
    await promptInstall()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isInstallable || isInstalled || !isVisible) {
    return null
  }

  return (
    <div className="install-banner">
      <div className="install-banner-content">
        <div className="install-banner-text">
          <span className="install-icon">📱</span>
          <div>
            <strong>アプリをインストール</strong>
            <p>ホーム画面に追加してより便利に！</p>
          </div>
        </div>
        
        <div className="install-banner-actions">
          <button onClick={handleDismiss} className="dismiss-button">
            ×
          </button>
          <button onClick={handleInstall} className="btn btn-primary install-mini-button">
            追加
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallBanner