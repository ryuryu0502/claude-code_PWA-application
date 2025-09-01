import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Eye, 
  Smartphone, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Download,
  ExternalLink
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { CampaignAnalytics, HostAnalytics } from '../../types/database';

interface AnalyticsDashboardProps {
  campaignId?: string;
  hostId?: string;
  type: 'campaign' | 'host';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  campaignId,
  hostId,
  type
}) => {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | HostAnalytics | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    loadRealtimeStats();
    
    // リアルタイム統計を定期更新
    const interval = setInterval(loadRealtimeStats, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [campaignId, hostId, type]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      let result;
      
      if (type === 'campaign' && campaignId) {
        result = await analyticsService.getCampaignAnalytics(campaignId);
      } else if (type === 'host' && hostId) {
        result = await analyticsService.getHostAnalytics(hostId);
      }
      
      if (result?.success) {
        setAnalytics(result.data);
      } else {
        setError(result?.error || '分析データの取得に失敗しました');
      }
    } catch (err) {
      setError('分析データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeStats = async () => {
    try {
      const result = await analyticsService.getRealtimeStats(campaignId, hostId);
      if (result.success) {
        setRealtimeStats(result.data);
      }
    } catch (err) {
      console.error('リアルタイム統計取得エラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadAnalytics}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">分析データがありません</p>
      </div>
    );
  }

  // 統計カードのデータ
  const getStatsCards = () => {
    if (type === 'campaign') {
      const campaignData = analytics as CampaignAnalytics;
      return [
        {
          title: 'アクセス数',
          value: campaignData.totalAccess,
          icon: Eye,
          color: 'bg-blue-500',
          change: realtimeStats ? `+${realtimeStats.totalAccess - campaignData.totalAccess}` : null
        },
        {
          title: '参加者数',
          value: campaignData.totalParticipants,
          icon: Users,
          color: 'bg-green-500',
          change: realtimeStats ? `+${realtimeStats.totalParticipants - campaignData.totalParticipants}` : null
        },
        {
          title: 'アプリインストール',
          value: campaignData.pwaInstalls,
          icon: Smartphone,
          color: 'bg-purple-500',
          change: realtimeStats ? `+${realtimeStats.totalInstalls - campaignData.pwaInstalls}` : null
        },
        {
          title: '当選者数',
          value: campaignData.winners,
          icon: Trophy,
          color: 'bg-yellow-500'
        }
      ];
    } else {
      const hostData = analytics as HostAnalytics;
      return [
        {
          title: 'キャンペーン数',
          value: hostData.totalCampaigns,
          icon: Calendar,
          color: 'bg-blue-500'
        },
        {
          title: '総参加者数',
          value: hostData.totalParticipants,
          icon: Users,
          color: 'bg-green-500'
        },
        {
          title: '総アクセス数',
          value: hostData.totalAccess,
          icon: Eye,
          color: 'bg-indigo-500'
        },
        {
          title: 'アプリインストール',
          value: hostData.totalPwaInstalls,
          icon: Download,
          color: 'bg-purple-500'
        }
      ];
    }
  };

  const statsCards = getStatsCards();

  // チャートの色設定
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* リアルタイム統計表示 */}
      {realtimeStats && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">リアルタイム統計</span>
            </div>
            <span className="text-xs text-gray-500">アクティブユーザー: {realtimeStats.activeUsers}人</span>
          </div>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  {stat.change && (
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp size={16} className="mr-1" />
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* コンバージョン率とインストール率 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">コンバージョン率</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {type === 'campaign' 
                ? (analytics as CampaignAnalytics).conversionRate.toFixed(1)
                : (analytics as HostAnalytics).averageConversionRate.toFixed(1)
              }%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              アクセス → 参加の変換率
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">アプリインストール率</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {type === 'campaign' 
                ? (analytics as CampaignAnalytics).installRate.toFixed(1)
                : (analytics as HostAnalytics).averageInstallRate.toFixed(1)
              }%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              参加者のアプリインストール率
            </p>
          </div>
        </div>
      </div>

      {/* 日別/月別統計グラフ */}
      {type === 'campaign' && (analytics as CampaignAnalytics).dailyStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">日別統計</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={(analytics as CampaignAnalytics).dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="access" stroke="#3B82F6" name="アクセス" />
              <Line type="monotone" dataKey="participants" stroke="#10B981" name="参加者" />
              <Line type="monotone" dataKey="installs" stroke="#8B5CF6" name="インストール" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {type === 'host' && (analytics as HostAnalytics).monthlyStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月別統計</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(analytics as HostAnalytics).monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="access" fill="#3B82F6" name="アクセス" />
              <Bar dataKey="participants" fill="#10B981" name="参加者" />
              <Bar dataKey="installs" fill="#8B5CF6" name="インストール" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* デバイス別統計 */}
      {type === 'campaign' && (analytics as CampaignAnalytics).deviceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">デバイス別アクセス</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(analytics as CampaignAnalytics).deviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(analytics as CampaignAnalytics).deviceStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">参照元</h3>
            <div className="space-y-3">
              {(analytics as CampaignAnalytics).referrerStats?.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ExternalLink size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{referrer.referrer}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{referrer.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* キャンペーン別パフォーマンス（ホスト用） */}
      {type === 'host' && (analytics as HostAnalytics).campaignPerformance && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">キャンペーン別パフォーマンス</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キャンペーン名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクセス数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    参加者数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    インストール数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コンバージョン率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analytics as HostAnalytics).campaignPerformance.map((campaign, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.campaignTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.access.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.participants.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.installs.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 最終更新時刻 */}
      <div className="text-center text-sm text-gray-500">
        最終更新: {new Date(analytics.lastUpdated).toLocaleString('ja-JP')}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;