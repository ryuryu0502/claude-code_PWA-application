import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  Trophy, 
  ExternalLink,
  BarChart3,
  Download,
  Share2,
  Settings
} from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { linkTrackingService } from '../../services/linkTrackingService';
import { analyticsService } from '../../services/analyticsService';
import { Campaign, CampaignFilter, SortOptions } from '../../types/database';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import InstallPrompt from '../PWA/InstallPrompt';

interface CampaignManagementProps {
  hostId: string;
}

export const CampaignManagement: React.FC<CampaignManagementProps> = ({ hostId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CampaignFilter>({ hostId });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    loadCampaigns();
  }, [filter, sortOptions]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaigns(filter, sortOptions, 20);
      if (result.success) {
        setCampaigns(result.data.items);
      } else {
        setError(result.error || 'キャンペーンの取得に失敗しました');
      }
    } catch (err) {
      setError('キャンペーンの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('このキャンペーンを削除してもよろしいですか？')) {
      return;
    }

    try {
      const result = await campaignService.deleteCampaign(campaignId, hostId);
      if (result.success) {
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      } else {
        alert(result.error || 'キャンペーンの削除に失敗しました');
      }
    } catch (err) {
      alert('キャンペーンの削除中にエラーが発生しました');
    }
  };

  const handleDrawWinners = async (campaignId: string, winnerCount: number) => {
    try {
      const result = await campaignService.drawWinners(campaignId, winnerCount, hostId);
      if (result.success) {
        alert(`${winnerCount}名の当選者を選出しました`);
        loadCampaigns();
      } else {
        alert(result.error || '抽選に失敗しました');
      }
    } catch (err) {
      alert('抽選中にエラーが発生しました');
    }
  };

  const copyLinkToClipboard = async (campaign: Campaign) => {
    try {
      const link = await linkTrackingService.getCampaignLink(campaign.id!);
      if (link.success && link.data) {
        const fullUrl = `${window.location.origin}/campaign/${link.data.code}`;
        await navigator.clipboard.writeText(fullUrl);
        alert('リンクをクリップボードにコピーしました');
      }
    } catch (err) {
      alert('リンクのコピーに失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ended': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '開催中';
      case 'draft': return '下書き';
      case 'ended': return '終了';
      case 'paused': return '一時停止';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showAnalytics && selectedCampaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCampaign.title} - 分析
            </h2>
            <p className="text-gray-600">キャンペーンの詳細な分析データ</p>
          </div>
          <button
            onClick={() => setShowAnalytics(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            戻る
          </button>
        </div>
        <AnalyticsDashboard 
          type="campaign" 
          campaignId={selectedCampaign.id} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PWAインストールプロンプト */}
      <InstallPrompt 
        variant="floating"
        title="アプリをインストール"
        description="キャンペーン管理をより快適に"
      />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">キャンペーン管理</h1>
          <p className="text-gray-600">キャンペーンの作成・管理・分析</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>新規キャンペーン</span>
        </button>
      </div>

      {/* フィルターとソート */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              <option value="active">開催中</option>
              <option value="draft">下書き</option>
              <option value="ended">終了</option>
              <option value="paused">一時停止</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              並び順
            </label>
            <select
              value={`${sortOptions.field}-${sortOptions.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortOptions({ field: field as any, direction: direction as 'asc' | 'desc' });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">作成日（新しい順）</option>
              <option value="createdAt-asc">作成日（古い順）</option>
              <option value="startDate-desc">開始日（新しい順）</option>
              <option value="startDate-asc">開始日（古い順）</option>
              <option value="title-asc">タイトル（A-Z）</option>
              <option value="title-desc">タイトル（Z-A）</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadCampaigns}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadCampaigns}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* キャンペーン一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* キャンペーン画像 */}
            {campaign.imageUrl && (
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6">
              {/* ステータスバッジ */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {getStatusText(campaign.status)}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowAnalytics(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="分析を表示"
                  >
                    <BarChart3 size={16} />
                  </button>
                  <button
                    onClick={() => copyLinkToClipboard(campaign)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="リンクをコピー"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* キャンペーン情報 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {campaign.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {campaign.description}
              </p>

              {/* 統計情報 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                    <Users size={16} />
                    <span className="text-lg font-semibold">{campaign.currentParticipants || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">参加者</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                    <Trophy size={16} />
                    <span className="text-lg font-semibold">{campaign.winnerCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">当選者</p>
                </div>
              </div>

              {/* 期間 */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                <span>
                  {new Date(campaign.startDate).toLocaleDateString('ja-JP')} - 
                  {new Date(campaign.endDate).toLocaleDateString('ja-JP')}
                </span>
              </div>

              {/* アクション */}
              <div className="flex space-x-2">
                {campaign.status === 'active' && campaign.maxWinners > 0 && (
                  <button
                    onClick={() => handleDrawWinners(campaign.id!, campaign.maxWinners)}
                    className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trophy size={14} />
                    <span>抽選</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowAnalytics(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye size={14} />
                  <span>詳細</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* キャンペーンが存在しない場合 */}
      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">キャンペーンがありません</h3>
          <p className="text-gray-600 mb-6">最初のキャンペーンを作成してみましょう</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>キャンペーンを作成</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;