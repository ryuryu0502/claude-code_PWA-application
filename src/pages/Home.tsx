import React, { useState, useEffect } from 'react';
import { useOffline } from '../hooks/useOffline';
import { campaignService, Campaign } from '../services/campaignService';
import CampaignList from '../components/Campaign/CampaignList';
import { useAuthStore } from '../stores/authStore';

const Home: React.FC = () => {
  const { isOffline } = useOffline();
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const unsubscribe = campaignService.subscribeToCampaigns((activeCampaigns) => {
      setCampaigns(activeCampaigns);
    });

    return () => unsubscribe();
  }, []);

  const handleJoinCampaign = async (campaignId: string) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await campaignService.joinCampaign(campaignId, user.uid);
      alert('企画に参加しました！');
    } catch (error) {
      console.error('Failed to join campaign:', error);
      alert('企画への参加に失敗しました。');
    }
  };

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
      </div>

      <div className="upcoming-campaigns">
        <h2>開催中のプレゼント企画</h2>
        <CampaignList campaigns={campaigns} onJoinCampaign={handleJoinCampaign} />
      </div>
    </div>
  );
};

export default Home;
