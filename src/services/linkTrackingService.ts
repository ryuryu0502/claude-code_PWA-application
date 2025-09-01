import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CampaignLink, 
  AccessLog, 
  ApiResponse
} from '../types/database';
import { participationService } from './participationService';

export class LinkTrackingService {
  private readonly linksCollection = 'campaignLinks';
  private readonly accessLogCollection = 'accessLogs';
  private readonly baseUrl = window.location.origin;

  // ユニークリンクの生成
  async generateCampaignLink(
    campaignId: string,
    hostId: string,
    customCode?: string
  ): Promise<ApiResponse<CampaignLink>> {
    try {
      // カスタムコードが指定されている場合は重複チェック
      if (customCode) {
        const existingLink = await this.getLinkByCode(customCode);
        if (existingLink.success) {
          return {
            success: false,
            error: 'Custom code already exists'
          };
        }
      }

      const uniqueCode = customCode || this.generateUniqueCode();
      const originalUrl = `${this.baseUrl}/campaign/${campaignId}`;
      const shortUrl = `${this.baseUrl}/l/${uniqueCode}`;

      const linkData: Omit<CampaignLink, 'id'> = {
        campaignId,
        hostId,
        uniqueCode,
        originalUrl,
        shortUrl,
        createdAt: new Date(),
        clickCount: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        installRate: 0
      };

      const docRef = await addDoc(collection(db, this.linksCollection), {
        ...linkData,
        createdAt: Timestamp.fromDate(linkData.createdAt)
      });

      const newLink: CampaignLink = {
        id: docRef.id,
        ...linkData
      };

      // キャンペーンドキュメントにユニークリンクを更新
      await updateDoc(doc(db, 'campaigns', campaignId), {
        uniqueLink: shortUrl
      });

      return {
        success: true,
        data: newLink,
        message: 'Campaign link generated successfully'
      };
    } catch (error) {
      console.error('Error generating campaign link:', error);
      return {
        success: false,
        error: 'Failed to generate campaign link'
      };
    }
  }

  // リンクコードによる取得
  async getLinkByCode(code: string): Promise<ApiResponse<CampaignLink>> {
    try {
      const q = query(
        collection(db, this.linksCollection),
        where('uniqueCode', '==', code)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Link not found'
        };
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      const link: CampaignLink = {
        id: doc.id,
        campaignId: data.campaignId,
        hostId: data.hostId,
        uniqueCode: data.uniqueCode,
        originalUrl: data.originalUrl,
        shortUrl: data.shortUrl,
        createdAt: data.createdAt.toDate(),
        clickCount: data.clickCount || 0,
        uniqueVisitors: data.uniqueVisitors || 0,
        conversionRate: data.conversionRate || 0,
        installRate: data.installRate || 0
      };

      return {
        success: true,
        data: link
      };
    } catch (error) {
      console.error('Error getting link by code:', error);
      return {
        success: false,
        error: 'Failed to get link'
      };
    }
  }

  // キャンペーンのリンク一覧取得
  async getCampaignLinks(campaignId: string): Promise<ApiResponse<CampaignLink[]>> {
    try {
      const q = query(
        collection(db, this.linksCollection),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const links: CampaignLink[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        links.push({
          id: doc.id,
          campaignId: data.campaignId,
          hostId: data.hostId,
          uniqueCode: data.uniqueCode,
          originalUrl: data.originalUrl,
          shortUrl: data.shortUrl,
          createdAt: data.createdAt.toDate(),
          clickCount: data.clickCount || 0,
          uniqueVisitors: data.uniqueVisitors || 0,
          conversionRate: data.conversionRate || 0,
          installRate: data.installRate || 0
        });
      });

      return {
        success: true,
        data: links
      };
    } catch (error) {
      console.error('Error getting campaign links:', error);
      return {
        success: false,
        error: 'Failed to get campaign links'
      };
    }
  }

  // リンククリックの追跡
  async trackLinkClick(
    uniqueCode: string,
    request: {
      ipAddress: string;
      userAgent: string;
      referrer?: string;
      userId?: string;
    }
  ): Promise<ApiResponse<{ redirectUrl: string; campaignId: string }>> {
    try {
      // リンク情報を取得
      const linkResult = await this.getLinkByCode(uniqueCode);
      if (!linkResult.success || !linkResult.data) {
        return {
          success: false,
          error: 'Invalid link code'
        };
      }

      const link = linkResult.data;

      // アクセスログを記録
      await participationService.logAccess(
        link.campaignId,
        link.id,
        request.userId,
        request.ipAddress,
        request.userAgent,
        request.referrer,
        this.isPwaAccess(request.userAgent)
      );

      // リンクのクリック数を更新
      await this.updateLinkStats(link.id, request.ipAddress);

      // キャンペーンのアクセス数を更新
      await this.updateCampaignAccessCount(link.campaignId);

      return {
        success: true,
        data: {
          redirectUrl: link.originalUrl,
          campaignId: link.campaignId
        }
      };
    } catch (error) {
      console.error('Error tracking link click:', error);
      return {
        success: false,
        error: 'Failed to track link click'
      };
    }
  }

  // リンク統計の更新
  private async updateLinkStats(linkId: string, ipAddress: string): Promise<void> {
    try {
      // クリック数を増加
      await updateDoc(doc(db, this.linksCollection, linkId), {
        clickCount: increment(1)
      });

      // ユニークビジター数の更新（IPアドレスベース）
      // 実際の実装では、より詳細なユニークビジター追跡を行う
      const uniqueVisitorCheck = await this.isUniqueVisitor(linkId, ipAddress);
      if (uniqueVisitorCheck) {
        await updateDoc(doc(db, this.linksCollection, linkId), {
          uniqueVisitors: increment(1)
        });
      }

      // コンバージョン率とインストール率を再計算
      await this.recalculateLinkRates(linkId);
    } catch (error) {
      console.error('Error updating link stats:', error);
    }
  }

  // ユニークビジターかどうかの判定
  private async isUniqueVisitor(linkId: string, ipAddress: string): Promise<boolean> {
    try {
      // 過去24時間以内の同じIPアドレスからのアクセスをチェック
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, this.accessLogCollection),
        where('linkId', '==', linkId),
        where('ipAddress', '==', ipAddress),
        where('accessedAt', '>=', Timestamp.fromDate(oneDayAgo))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking unique visitor:', error);
      return false;
    }
  }

  // リンクの変換率を再計算
  private async recalculateLinkRates(linkId: string): Promise<void> {
    try {
      const linkDoc = await getDoc(doc(db, this.linksCollection, linkId));
      if (!linkDoc.exists()) return;

      const linkData = linkDoc.data();
      const campaignId = linkData.campaignId;

      // 参加者数を取得
      const participantsQuery = query(
        collection(db, 'userCampaignParticipations'),
        where('campaignId', '==', campaignId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const participantCount = participantsSnapshot.size;

      // PWAインストール数を取得
      const installsQuery = query(
        collection(db, 'userCampaignParticipations'),
        where('campaignId', '==', campaignId),
        where('isPwaInstalled', '==', true)
      );
      const installsSnapshot = await getDocs(installsQuery);
      const installCount = installsSnapshot.size;

      // 変換率を計算
      const clickCount = linkData.clickCount || 0;
      const conversionRate = clickCount > 0 ? (participantCount / clickCount) * 100 : 0;
      const installRate = participantCount > 0 ? (installCount / participantCount) * 100 : 0;

      await updateDoc(doc(db, this.linksCollection, linkId), {
        conversionRate: Math.round(conversionRate * 100) / 100,
        installRate: Math.round(installRate * 100) / 100
      });
    } catch (error) {
      console.error('Error recalculating link rates:', error);
    }
  }

  // キャンペーンのアクセス数を更新
  private async updateCampaignAccessCount(campaignId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        accessCount: increment(1)
      });
    } catch (error) {
      console.error('Error updating campaign access count:', error);
    }
  }

  // PWAアクセスかどうかの判定
  private isPwaAccess(userAgent: string): boolean {
    // PWAとしてアクセスされているかを判定
    // 実際の実装では、より詳細な判定ロジックを使用
    return userAgent.includes('wv') || // WebView
           userAgent.includes('Mobile') && !userAgent.includes('Safari') ||
           navigator.standalone === true; // iOS PWA
  }

  // ユニークコードの生成
  private generateUniqueCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // リンクの削除
  async deleteLink(linkId: string): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, this.linksCollection, linkId), {
        deletedAt: Timestamp.now(),
        isActive: false
      });

      return {
        success: true,
        message: 'Link deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting link:', error);
      return {
        success: false,
        error: 'Failed to delete link'
      };
    }
  }

  // ホストのリンク統計取得
  async getHostLinkStats(hostId: string): Promise<ApiResponse<{
    totalLinks: number;
    totalClicks: number;
    totalUniqueVisitors: number;
    averageConversionRate: number;
    averageInstallRate: number;
  }>> {
    try {
      const q = query(
        collection(db, this.linksCollection),
        where('hostId', '==', hostId)
      );

      const querySnapshot = await getDocs(q);
      let totalLinks = 0;
      let totalClicks = 0;
      let totalUniqueVisitors = 0;
      let totalConversionRate = 0;
      let totalInstallRate = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalLinks++;
        totalClicks += data.clickCount || 0;
        totalUniqueVisitors += data.uniqueVisitors || 0;
        totalConversionRate += data.conversionRate || 0;
        totalInstallRate += data.installRate || 0;
      });

      const stats = {
        totalLinks,
        totalClicks,
        totalUniqueVisitors,
        averageConversionRate: totalLinks > 0 ? Math.round((totalConversionRate / totalLinks) * 100) / 100 : 0,
        averageInstallRate: totalLinks > 0 ? Math.round((totalInstallRate / totalLinks) * 100) / 100 : 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting host link stats:', error);
      return {
        success: false,
        error: 'Failed to get host link stats'
      };
    }
  }
}

export const linkTrackingService = new LinkTrackingService();