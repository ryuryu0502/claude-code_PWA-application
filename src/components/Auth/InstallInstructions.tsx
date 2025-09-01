import React, { useState } from 'react'

const InstallInstructions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android')

  return (
    <div className="install-instructions">
      <div className="install-header">
        <h2>📱 アプリをインストール</h2>
        <p className="install-subtitle">ホーム画面にアプリを追加して、いつでもアクセス！</p>
      </div>
      
      <div className="platform-tabs">
        <button 
          className={`tab-button ${activeTab === 'android' ? 'active' : ''}`}
          onClick={() => setActiveTab('android')}
        >
          🤖 Android（Chrome）
        </button>
        <button 
          className={`tab-button ${activeTab === 'ios' ? 'active' : ''}`}
          onClick={() => setActiveTab('ios')}
        >
          🍎 iPhone（Safari）
        </button>
      </div>

      <div className="platform-content">
        {activeTab === 'android' && (
          <div className="platform android">
            <ol className="install-steps">
              <li>右上の「⋮」メニューをタップ</li>
              <li>「アプリをインストール」を選択</li>
              <li>「インストール」ボタンをタップ</li>
              <li>ホーム画面にアイコンが追加されます</li>
            </ol>
            <div className="tip">
              💡 <strong>ヒント：</strong> メニューに「アプリをインストール」が表示されない場合は、「ホーム画面に追加」を選択してください
            </div>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="platform ios">
            <ol className="install-steps">
              <li>下部の「共有」ボタン（□↑）をタップ</li>
              <li>「ホーム画面に追加」を選択</li>
              <li>アプリ名を確認して「追加」をタップ</li>
              <li>ホーム画面にアイコンが追加されます</li>
            </ol>
            <div className="tip">
              💡 <strong>ヒント：</strong> Safariで開いている必要があります。他のブラウザでは利用できません
            </div>
          </div>
        )}
      </div>

      <div className="install-benefits">
        <h3>✨ インストールのメリット</h3>
        <ul className="benefits-list">
          <li>🚀 アプリのように高速起動</li>
          <li>📢 プッシュ通知を受信</li>
          <li>📶 オフラインでも基本機能を利用</li>
          <li>🎯 ホーム画面から直接アクセス</li>
        </ul>
      </div>
    </div>
  )
}

export default InstallInstructions