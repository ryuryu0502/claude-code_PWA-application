import React from 'react';
import { Campaign } from '../../services/campaignService';
import CampaignCard from './CampaignCard';

interface CampaignListProps {
  campaigns: Campaign[];
  onJoinCampaign: (campaignId: string) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onJoinCampaign }) => {
  if (campaigns.length === 0) {
    return (
      <div className="empty-state">
        <p>現在参加可能な企画はありません。</p>
        <p>新しい企画をお楽しみに！</p>
      </div>
    );
  }

  return (
    <div className="campaigns-grid">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onJoin={onJoinCampaign} />
      ))}
    </div>
  );
};

export default CampaignList;
