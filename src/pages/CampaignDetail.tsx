import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignService, Campaign } from '../../services/campaignService';
import { useAuthStore } from '../../stores/authStore';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      setIsLoading(true);
      try {
        const fetchedCampaign = await campaignService.getCampaign(id);
        setCampaign(fetchedCampaign);
      } catch (error) {
        console.error('Failed to fetch campaign:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleJoinCampaign = async () => {
    if (!user) {
      alert('ログインが必要です。');
      navigate('/register');
      return;
    }
    if (!campaign) return;

    try {
      await campaignService.joinCampaign(campaign.id, user.uid);
      alert('企画に参加しました！');
    } catch (error) {
      console.error('Failed to join campaign:', error);
      alert('企画への参加に失敗しました。');
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (!campaign) {
    return <div>企画が見つかりません。</div>;
  }

  return (
    <div className="campaign-detail-page">
      <button onClick={() => navigate('/')} className="back-button">← ホームに戻る</button>
      <div className="campaign-detail-card modern-card">
        <h1>{campaign.title}</h1>
        <p className="host-name">主催者: {campaign.hostName}</p>
        <p className="prize">景品: {campaign.prize}</p>
        <p className="description">{campaign.description}</p>
        <p className="end-date">終了日時: {new Date(campaign.endDate).toLocaleString()}</p>
        <p className="participants">現在の参加者数: {campaign.participants.length}人</p>
        {campaign.maxParticipants && <p>最大参加者数: {campaign.maxParticipants}人</p>}
        <button className="btn btn-primary join-button" onClick={handleJoinCampaign}>
          この企画に参加する
        </button>
      </div>
    </div>
  );
};

export default CampaignDetail;
