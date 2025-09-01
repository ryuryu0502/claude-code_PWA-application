import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CampaignAnalytics, 
  HostAnalytics, 
  ApiResponse 
} from '../types/database';

export class AnalyticsService {
  // キャンペーン分析データの取得
  async getCampaignAnalytics(campaignId: string): Promise<ApiResponse<CampaignAnalytics>> {
    try {
      // キャンペーン基本情報を取得
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return {
          success: false,
          error: 'キャンペーンが見つかりません'
        };
      }

      const campaignData = campaignDoc.data();

      // 参加者データを取得
      const participantsQuery = query(
        collection(db, 'userCampaignParticipations'),
        where('campaignId', '==', campaignId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const participants = participantsSnapshot.docs.map(doc => doc.data());

      // リンクアクセスデータを取得
      const linksQuery = query(
        collection(db, 'campaignLinks'),
        where('campaignId', '==', campaignId)
      );
      const linksSnapshot = await getDocs(linksQuery);
      const links = linksSnapshot.docs.map(doc => doc.data());

      // アクセスログを取得
      const accessLogsQuery = query(
        collection(db, 'accessLogs'),
        where('campaignId', '==', campaignId)
      );
      const accessLogsSnapshot = await getDocs(accessLogsQuery);
      const accessLogs = accessLogsSnapshot.docs.map(doc => doc.data());

      // 統計計算
      const totalParticipants = participants.length;
      const totalAccess = accessLogs.length;
      const uniqueVisitors = new Set(accessLogs.map(log => log.userId || log.sessionId)).size;
      const pwaInstalls = participants.filter(p => p.pwaInstalled).length;
      const winners = participants.filter(p => p.isWinner).length;
      const installPromptShown = participants.filter(p => p.installPromptShown).length;

      // 日別統計
      const dailyStats = this.calculateDailyStats(accessLogs, participants);

      // デバイス別統計
      const deviceStats = this.calculateDeviceStats(accessLogs);

      // リファラー統計
      const referrerStats = this.calculateReferrerStats(participants);

      const analytics: CampaignAnalytics = {
        campaignId,
        totalParticipants,
        totalAccess,
        uniqueVisitors,
        pwaInstalls,
        winners,
        installPromptShown,
        conversionRate: totalAccess > 0 ? (totalParticipants / totalAccess) * 100 : 0,
        installRate: totalParticipants > 0 ? (pwaInstalls / totalParticipants) * 100 : 0,
        winnerRate: totalParticipants > 0 ? (winners / totalParticipants) * 100 : 0,
        dailyStats,
        deviceStats,
        referrerStats,
        lastUpdated: new Date()
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('キャンペーン分析データ取得エラー:', error);
      return {
        success: false,
        error: '分析データの取得中にエラーが発生しました'
      };
    }
  }

  // ホスト分析データの取得
  async getHostAnalytics(hostId: string): Promise<ApiResponse<HostAnalytics>> {
    try {
      // ホストのキャンペーン一覧を取得
      const campaignsQuery = query(
        collection(db, 'campaigns'),
        where('hostId', '==', hostId)
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaigns = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (campaigns.length === 0) {
        return {
          success: true,
          data: {
            hostId,
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalParticipants: 0,
            totalAccess: 0,
            totalPwaInstalls: 0,
            totalWinners: 0,
            averageConversionRate: 0,
            averageInstallRate: 0,
            campaignPerformance: [],
            monthlyStats: [],
            lastUpdated: new Date()
          }
        };
      }

      const campaignIds = campaigns.map(c => c.id);

      // 全参加者データを取得
      const participantsQuery = query(
        collection(db, 'userCampaignParticipations'),
        where('hostId', '==', hostId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const participants = participantsSnapshot.docs.map(doc => doc.data());

      // 全アクセスログを取得
      const accessLogsQuery = query(
        collection(db, 'accessLogs'),
        where('hostId', '==', hostId)
      );
      const accessLogsSnapshot = await getDocs(accessLogsQuery);
      const accessLogs = accessLogsSnapshot.docs.map(doc => doc.data());

      // 統計計算
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const totalParticipants = participants.length;
      const totalAccess = accessLogs.length;
      const totalPwaInstalls = participants.filter(p => p.pwaInstalled).length;
      const totalWinners = participants.filter(p => p.isWinner).length;

      // キャンペーン別パフォーマンス
      const campaignPerformance = await Promise.all(
        campaigns.map(async (campaign) => {
          const campaignParticipants = participants.filter(p => p.campaignId === campaign.id);
          const campaignAccess = accessLogs.filter(log => log.campaignId === campaign.id);
          const campaignInstalls = campaignParticipants.filter(p => p.pwaInstalled).length;
          
          return {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            participants: campaignParticipants.length,
            access: campaignAccess.length,
            installs: campaignInstalls,
            conversionRate: campaignAccess.length > 0 ? 
              (campaignParticipants.length / campaignAccess.length) * 100 : 0,
            installRate: campaignParticipants.length > 0 ? 
              (campaignInstalls / campaignParticipants.length) * 100 : 0
          };
        })
      );

      // 月別統計
      const monthlyStats = this.calculateMonthlyStats(accessLogs, participants);

      const analytics: HostAnalytics = {
        hostId,
        totalCampaigns,
        activeCampaigns,
        totalParticipants,
        totalAccess,
        totalPwaInstalls,
        totalWinners,
        averageConversionRate: totalAccess > 0 ? (totalParticipants / totalAccess) * 100 : 0,
        averageInstallRate: totalParticipants > 0 ? (totalPwaInstalls / totalParticipants) * 100 : 0,
        campaignPerformance,
        monthlyStats,
        lastUpdated: new Date()
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('ホスト分析データ取得エラー:', error);
      return {
        success: false,
        error: 'ホスト分析データの取得中にエラーが発生しました'
      };
    }
  }

  // 日別統計の計算
  private calculateDailyStats(accessLogs: any[], participants: any[]) {
    const dailyData = new Map<string, { access: number; participants: number; installs: number }>();

    // アクセスログから日別データを集計
    accessLogs.forEach(log => {
      const date = new Date(log.timestamp.seconds * 1000).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { access: 0, participants: 0, installs: 0 });
      }
      dailyData.get(date)!.access++;
    });

    // 参加者データから日別データを集計
    participants.forEach(participant => {
      const date = new Date(participant.joinedAt.seconds * 1000).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { access: 0, participants: 0, installs: 0 });
      }
      dailyData.get(date)!.participants++;
      if (participant.pwaInstalled) {
        dailyData.get(date)!.installs++;
      }
    });

    return Array.from(dailyData.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // デバイス別統計の計算
  private calculateDeviceStats(accessLogs: any[]) {
    const deviceCounts = new Map<string, number>();
    
    accessLogs.forEach(log => {
      const device = log.deviceType || 'unknown';
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
    });

    return Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }

  // リファラー統計の計算
  private calculateReferrerStats(participants: any[]) {
    const referrerCounts = new Map<string, number>();
    
    participants.forEach(participant => {
      const referrer = participant.referralSource || 'direct';
      referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
    });

    return Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count);
  }

  // 月別統計の計算
  private calculateMonthlyStats(accessLogs: any[], participants: any[]) {
    const monthlyData = new Map<string, { access: number; participants: number; installs: number }>();

    // アクセスログから月別データを集計
    accessLogs.forEach(log => {
      const date = new Date(log.timestamp.seconds * 1000);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { access: 0, participants: 0, installs: 0 });
      }
      monthlyData.get(month)!.access++;
    });

    // 参加者データから月別データを集計
    participants.forEach(participant => {
      const date = new Date(participant.joinedAt.seconds * 1000);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { access: 0, participants: 0, installs: 0 });
      }
      monthlyData.get(month)!.participants++;
      if (participant.pwaInstalled) {
        monthlyData.get(month)!.installs++;
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // リアルタイム統計の取得（最新の数値のみ）
  async getRealtimeStats(campaignId?: string, hostId?: string): Promise<ApiResponse<{
    totalAccess: number;
    totalParticipants: number;
    totalInstalls: number;
    activeUsers: number;
  }>> {
    try {
      let accessQuery = query(collection(db, 'accessLogs'));
      let participantsQuery = query(collection(db, 'userCampaignParticipations'));

      if (campaignId) {
        accessQuery = query(accessQuery, where('campaignId', '==', campaignId));
        participantsQuery = query(participantsQuery, where('campaignId', '==', campaignId));
      } else if (hostId) {
        accessQuery = query(accessQuery, where('hostId', '==', hostId));
        participantsQuery = query(participantsQuery, where('hostId', '==', hostId));
      }

      const [accessSnapshot, participantsSnapshot] = await Promise.all([
        getDocs(accessQuery),
        getDocs(participantsQuery)
      ]);

      const accessLogs = accessSnapshot.docs.map(doc => doc.data());
      const participants = participantsSnapshot.docs.map(doc => doc.data());

      // 過去1時間のアクティブユーザー数を計算
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const activeUsers = accessLogs.filter(log => {
        const logTime = new Date(log.timestamp.seconds * 1000);
        return logTime > oneHourAgo;
      }).length;

      return {
        success: true,
        data: {
          totalAccess: accessLogs.length,
          totalParticipants: participants.length,
          totalInstalls: participants.filter(p => p.pwaInstalled).length,
          activeUsers
        }
      };
    } catch (error) {
      console.error('リアルタイム統計取得エラー:', error);
      return {
        success: false,
        error: 'リアルタイム統計の取得中にエラーが発生しました'
      };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const analyticsService = new AnalyticsService();