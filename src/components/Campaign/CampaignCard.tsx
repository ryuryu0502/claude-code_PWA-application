import React from 'react';
import { Link } from 'react-router-dom';
import { Campaign } from '../../services/campaignService';

interface CampaignCardProps {
  campaign: Campaign;
  onJoin: (campaignId: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onJoin }) => {
  return (
    <div className="campaign-card modern-card">
      <div className="campaign-header">
        <h3>{campaign.title}</h3>
        <span className={`status-badge ${campaign.status}`}>{campaign.status}</span>
      </div>
      <p className="campaign-description">{campaign.description}</p>
      <div className="campaign-stats">
        <span>🎁 {campaign.prize}</span>
        <span>👥 {campaign.participants.length}人参加</span>
      </div>
      <div className="campaign-actions">
        <button className="btn btn-primary" onClick={() => onJoin(campaign.id)}>
          参加する
        </button>
        <Link to={`/campaign/${campaign.id}`} className="btn btn-ghost">詳細</Link>
      </div>
    </div>
  );
};

export default CampaignCard;
