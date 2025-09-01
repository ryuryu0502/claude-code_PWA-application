import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  UserCampaignParticipation, 
  AccessLog, 
  ParticipationFilter, 
  SortOptions, 
  PaginatedResponse,
  ApiResponse
} from '../types/database';

export class ParticipationService {
  private readonly participationCollection = 'userCampaignParticipations';
  private readonly accessLogCollection = 'accessLogs';

  // 参加者の登録
  async createParticipation(
    userId: string,
    campaignId: string,
    hostId: string,
    referralSource: string = 'direct'
  ): Promise<ApiResponse<UserCampaignParticipation>> {
    try {
      // 既存の参加をチェック
      const existingParticipation = await this.getParticipation(userId, campaignId);
      if (existingParticipation.success && existingParticipation.data) {
        return {
          success: false,
          error: 'User already participated in this campaign'
        };
      }

      const participation: Omit<UserCampaignParticipation, 'id'> = {
        userId,
        campaignId,
        hostId,
        participatedAt: new Date(),
        referralSource,
        isPwaInstalled: false,
        notificationEnabled: false,
        isWinner: false
      };

      const docRef = await addDoc(collection(db, this.participationCollection), {
        ...participation,
        participatedAt: Timestamp.fromDate(participation.participatedAt)
      });

      const newParticipation: UserCampaignParticipation = {
        id: docRef.id,
        ...participation
      };

      // キャンペーンの参加者数を更新
      await this.updateCampaignParticipantCount(campaignId);

      return {
        success: true,
        data: newParticipation,
        message: 'Participation created successfully'
      };
    } catch (error) {
      console.error('Error creating participation:', error);
      return {
        success: false,
        error: 'Failed to create participation'
      };
    }
  }

  // 参加情報の取得
  async getParticipation(
    userId: string, 
    campaignId: string
  ): Promise<ApiResponse<UserCampaignParticipation>> {
    try {
      const q = query(
        collection(db, this.participationCollection),
        where('userId', '==', userId),
        where('campaignId', '==', campaignId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Participation not found'
        };
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      const participation: UserCampaignParticipation = {
        id: doc.id,
        userId: data.userId,
        campaignId: data.campaignId,
        hostId: data.hostId,
        participatedAt: data.participatedAt.toDate(),
        referralSource: data.referralSource,
        isPwaInstalled: data.isPwaInstalled || false,
        pwaInstalledAt: data.pwaInstalledAt?.toDate(),
        installPromptShownAt: data.installPromptShownAt?.toDate(),
        installPromptDismissedAt: data.installPromptDismissedAt?.toDate(),
        notificationEnabled: data.notificationEnabled || false,
        notificationToken: data.notificationToken,
        isWinner: data.isWinner || false,
        wonAt: data.wonAt?.toDate(),
        prizeClaimedAt: data.prizeClaimedAt?.toDate()
      };

      return {
        success: true,
        data: participation
      };
    } catch (error) {
      console.error('Error getting participation:', error);
      return {
        success: false,
        error: 'Failed to get participation'
      };
    }
  }

  // PWAインストール状態の更新
  async updatePwaInstallStatus(
    userId: string,
    campaignId: string,
    isInstalled: boolean
  ): Promise<ApiResponse<void>> {
    try {
      const participationResult = await this.getParticipation(userId, campaignId);
      if (!participationResult.success || !participationResult.data) {
        return {
          success: false,
          error: 'Participation not found'
        };
      }

      const updateData: any = {
        isPwaInstalled: isInstalled,
        updatedAt: Timestamp.now()
      };

      if (isInstalled) {
        updateData.pwaInstalledAt = Timestamp.now();
      }

      await updateDoc(
        doc(db, this.participationCollection, participationResult.data.id),
        updateData
      );

      // キャンペーンのインストール統計を更新
      await this.updateCampaignInstallStats(campaignId);

      return {
        success: true,
        message: 'PWA install status updated successfully'
      };
    } catch (error) {
      console.error('Error updating PWA install status:', error);
      return {
        success: false,
        error: 'Failed to update PWA install status'
      };
    }
  }

  // インストールプロンプト表示の記録
  async recordInstallPromptShown(
    userId: string,
    campaignId: string
  ): Promise<ApiResponse<void>> {
    try {
      const participationResult = await this.getParticipation(userId, campaignId);
      if (!participationResult.success || !participationResult.data) {
        return {
          success: false,
          error: 'Participation not found'
        };
      }

      await updateDoc(
        doc(db, this.participationCollection, participationResult.data.id),
        {
          installPromptShownAt: Timestamp.now()
        }
      );

      return {
        success: true,
        message: 'Install prompt shown recorded'
      };
    } catch (error) {
      console.error('Error recording install prompt shown:', error);
      return {
        success: false,
        error: 'Failed to record install prompt shown'
      };
    }
  }

  // 通知設定の更新
  async updateNotificationSettings(
    userId: string,
    campaignId: string,
    enabled: boolean,
    token?: string
  ): Promise<ApiResponse<void>> {
    try {
      const participationResult = await this.getParticipation(userId, campaignId);
      if (!participationResult.success || !participationResult.data) {
        return {
          success: false,
          error: 'Participation not found'
        };
      }

      const updateData: any = {
        notificationEnabled: enabled
      };

      if (token) {
        updateData.notificationToken = token;
      }

      await updateDoc(
        doc(db, this.participationCollection, participationResult.data.id),
        updateData
      );

      return {
        success: true,
        message: 'Notification settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return {
        success: false,
        error: 'Failed to update notification settings'
      };
    }
  }

  // 当選者の設定
  async setWinner(
    userId: string,
    campaignId: string
  ): Promise<ApiResponse<void>> {
    try {
      const participationResult = await this.getParticipation(userId, campaignId);
      if (!participationResult.success || !participationResult.data) {
        return {
          success: false,
          error: 'Participation not found'
        };
      }

      await updateDoc(
        doc(db, this.participationCollection, participationResult.data.id),
        {
          isWinner: true,
          wonAt: Timestamp.now()
        }
      );

      return {
        success: true,
        message: 'Winner set successfully'
      };
    } catch (error) {
      console.error('Error setting winner:', error);
      return {
        success: false,
        error: 'Failed to set winner'
      };
    }
  }

  // キャンペーン参加者一覧の取得
  async getCampaignParticipants(
    campaignId: string,
    page: number = 1,
    pageLimit: number = 20,
    sortOptions?: SortOptions
  ): Promise<ApiResponse<PaginatedResponse<UserCampaignParticipation>>> {
    try {
      let q = query(
        collection(db, this.participationCollection),
        where('campaignId', '==', campaignId)
      );

      // ソート追加
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.order));
      } else {
        q = query(q, orderBy('participatedAt', 'desc'));
      }

      // ページネーション
      const offset = (page - 1) * pageLimit;
      if (offset > 0) {
        // 実際の実装では、startAfter を使用してより効率的なページネーションを実装
        q = query(q, limit(pageLimit));
      } else {
        q = query(q, limit(pageLimit));
      }

      const querySnapshot = await getDocs(q);
      const participants: UserCampaignParticipation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        participants.push({
          id: doc.id,
          userId: data.userId,
          campaignId: data.campaignId,
          hostId: data.hostId,
          participatedAt: data.participatedAt.toDate(),
          referralSource: data.referralSource,
          isPwaInstalled: data.isPwaInstalled || false,
          pwaInstalledAt: data.pwaInstalledAt?.toDate(),
          installPromptShownAt: data.installPromptShownAt?.toDate(),
          installPromptDismissedAt: data.installPromptDismissedAt?.toDate(),
          notificationEnabled: data.notificationEnabled || false,
          notificationToken: data.notificationToken,
          isWinner: data.isWinner || false,
          wonAt: data.wonAt?.toDate(),
          prizeClaimedAt: data.prizeClaimedAt?.toDate()
        });
      });

      // 総数を取得（実際の実装では、別途カウント用のドキュメントを使用することを推奨）
      const totalQuery = query(
        collection(db, this.participationCollection),
        where('campaignId', '==', campaignId)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      const paginatedResponse: PaginatedResponse<UserCampaignParticipation> = {
        items: participants,
        total,
        page,
        limit: pageLimit,
        hasNext: page * pageLimit < total,
        hasPrev: page > 1
      };

      return {
        success: true,
        data: paginatedResponse
      };
    } catch (error) {
      console.error('Error getting campaign participants:', error);
      return {
        success: false,
        error: 'Failed to get campaign participants'
      };
    }
  }

  // アクセスログの記録
  async logAccess(
    campaignId: string,
    linkId: string | undefined,
    userId: string | undefined,
    ipAddress: string,
    userAgent: string,
    referrer?: string,
    isPwaAccess: boolean = false
  ): Promise<ApiResponse<void>> {
    try {
      const accessLog: Omit<AccessLog, 'id'> = {
        campaignId,
        linkId,
        userId,
        accessedAt: new Date(),
        ipAddress,
        userAgent,
        referrer,
        isPwaAccess,
        installPromptShown: false,
        installCompleted: false
      };

      await addDoc(collection(db, this.accessLogCollection), {
        ...accessLog,
        accessedAt: Timestamp.fromDate(accessLog.accessedAt)
      });

      return {
        success: true,
        message: 'Access logged successfully'
      };
    } catch (error) {
      console.error('Error logging access:', error);
      return {
        success: false,
        error: 'Failed to log access'
      };
    }
  }

  // キャンペーンの参加者数を更新
  private async updateCampaignParticipantCount(campaignId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.participationCollection),
        where('campaignId', '==', campaignId)
      );
      const querySnapshot = await getDocs(q);
      const participantCount = querySnapshot.size;

      await updateDoc(doc(db, 'campaigns', campaignId), {
        participantCount
      });
    } catch (error) {
      console.error('Error updating campaign participant count:', error);
    }
  }

  // キャンペーンのインストール統計を更新
  private async updateCampaignInstallStats(campaignId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.participationCollection),
        where('campaignId', '==', campaignId),
        where('isPwaInstalled', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const installCompleted = querySnapshot.size;

      await updateDoc(doc(db, 'campaigns', campaignId), {
        installCompleted
      });
    } catch (error) {
      console.error('Error updating campaign install stats:', error);
    }
  }
}

export const participationService = new ParticipationService();