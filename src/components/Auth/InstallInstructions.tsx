import React from 'react'

const InstallInstructions: React.FC = () => {
  return (
    <div className="install-instructions">
      <h2>アプリをインストール</h2>
      
      <div className="platform-instructions">
        <div className="platform">
          <h3>Android</h3>
          <ol>
            <li>ブラウザのメニューを開く</li>
            <li>「ホーム画面に追加」を選択</li>
            <li>「インストール」をタップ</li>
          </ol>
        </div>

        <div className="platform">
          <h3>iPhone</h3>
          <ol>
            <li>Safariの共有ボタンをタップ</li>
            <li>「ホーム画面に追加」を選択</li>
            <li>「追加」をタップ</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default InstallInstructions