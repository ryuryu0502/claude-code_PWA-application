import React from 'react'
import { useOffline } from '../hooks/useOffline'

const Home: React.FC = () => {
  const { isOffline } = useOffline()

  return (
    <div className="home-page">
      {isOffline && (
        <div className="offline-banner">
          オフラインモードです
        </div>
      )}
      
      <h1>お知らせ</h1>
      
      <div className="announcements">
        <div className="announcement">
          <h3>アプリへようこそ！</h3>
          <p>プレゼント企画に参加して素敵な賞品をゲットしよう！</p>
          <span className="date">2024-01-01</span>
        </div>
        
        <div className="announcement">
          <h3>新機能追加のお知らせ</h3>
          <p>ユーザープロフィール機能が追加されました。</p>
          <span className="date">2024-01-02</span>
        </div>
      </div>

      <div className="upcoming-campaigns">
        <h2>今後のプレゼント企画</h2>
        <p>新しいプレゼント企画をお楽しみに！</p>
        <div className="campaign-placeholder">
          準備中...
        </div>
      </div>
    </div>
  )
}

export default Home