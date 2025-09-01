import React from 'react'

const InstallInstructions: React.FC = () => {
  return (
    <div className="install-instructions">
      <h2>📱 アプリをインストール</h2>
      <p className="install-subtitle">ホーム画面にアプリを追加して、いつでもアクセス！</p>
      
      <div className="platform-instructions">
        <div className="platform android">
          <h3>🤖 Android（Chrome）</h3>
          <ol>
            <li>右上の「⋮」メニューをタップ</li>
            <li>「アプリをインストール」を選択</li>
            <li>「インストール」ボタンをタップ</li>
            <li>ホーム画面にアイコンが追加されます</li>
          </ol>
          <div className="tip">
            💡 <strong>ヒント：</strong> メニューに「アプリをインストール」が表示されない場合は、「ホーム画面に追加」を選択してください
          </div>
        </div>

        <div className="platform ios">
          <h3>🍎 iPhone（Safari）</h3>
          <ol>
            <li>下部の「共有」ボタン（□↑）をタップ</li>
            <li>「ホーム画面に追加」を選択</li>
            <li>アプリ名を確認して「追加」をタップ</li>
            <li>ホーム画面にアイコンが追加されます</li>
          </ol>
          <div className="tip">
            💡 <strong>ヒント：</strong> Safariで開いている必要があります。他のブラウザでは利用できません
          </div>
        </div>
      </div>

      <div className="install-benefits">
        <h3>✨ インストールのメリット</h3>
        <ul>
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