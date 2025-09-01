import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import { 
  Campaign, 
  Host, 
  CampaignFilter, 
  SortOptions, 
  PaginatedResponse, 
  ApiResponse 
} from '../types/database'
import { participationService } from './participationService'
import { linkTrackingService } from './linkTrackingService'

// 後方互換性のための旧型定義
export interface LegacyCampaignParticipant {
  campaignId: string
  userId: string
  joinedAt: Date
  installLink?: string
}

export class CampaignService {
  // キャンペーンの作成（新しいデータ構造対応）
  async createCampaign(
    campaignData: {
      title: string;
      description: string;
      giftDescription: string;
      maxParticipants: number;
      startDate: Date;
      endDate: Date;
      drawDate: Date;
    },
    hostId: string,
    hostUsername: string
  ): Promise<ApiResponse<Campaign>> {
    try {
      // ホスト情報を確認
      const hostDoc = await getDoc(doc(db, 'hosts', hostId));
      if (!hostDoc.exists()) {
        return {
          success: false,
          error: 'ホストが見つかりません'
        };
      }

      const campaign: Omit<Campaign, 'id'> = {
        ...campaignData,
        hostId,
        hostUsername,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        uniqueLink: '', // 後で生成
        accessCount: 0,
        installPromptShown: 0,
        installCompleted: 0,
        participantCount: 0,
        winnerCount: 0
      };

      const docRef = await addDoc(collection(db, 'campaigns'), {
        ...campaign,
<<<<<<< HEAD
        participants: [],
        winners: [],
        createdAt: serverTimestamp(),
        status: 'draft'
      });
      return docRef.id;
=======
        startDate: Timestamp.fromDate(campaign.startDate),
        endDate: Timestamp.fromDate(campaign.endDate),
        drawDate: Timestamp.fromDate(campaign.drawDate),
        createdAt: Timestamp.fromDate(campaign.createdAt),
        updatedAt: Timestamp.fromDate(campaign.updatedAt)
      });

      const newCampaign: Campaign = {
        id: docRef.id,
        ...campaign
      };

      // ユニークリンクを生成
      const linkResult = await linkTrackingService.generateCampaignLink(
        docRef.id,
        hostId
      );

      if (linkResult.success && linkResult.data) {
        newCampaign.uniqueLink = linkResult.data.shortUrl;
      }

      return {
        success: true,
        data: newCampaign,
        message: 'キャンペーンが正常に作成されました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    } catch (error: any) {
      console.error('キャンペーン作成エラー:', error);
      if (error.code === 'permission-denied') {
        return {
          success: false,
          error: 'キャンペーンを作成する権限がありません。ホストとして登録されているか確認してください。'
        };
      }
<<<<<<< HEAD
      console.error('企画作成エラー:', error);
      throw new Error('企画の作成中に不明なエラーが発生しました。');
=======
      return {
        success: false,
        error: 'キャンペーンの作成中にエラーが発生しました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    }
  }

  // キャンペーンへの参加（新しい参加者管理システム対応）
  async joinCampaign(
    campaignId: string, 
    userId: string, 
    referralSource: string = 'direct'
  ): Promise<ApiResponse<void>> {
    try {
<<<<<<< HEAD
      const participantRef = collection(db, 'campaigns', campaignId, 'participants');
      const q = query(participantRef, where('userId', '==', userId));
      const existingParticipant = await getDocs(q);
      if (existingParticipant.empty) {
        const participantData = {
          campaignId,
          userId,
          joinedAt: serverTimestamp(),
          installLink
        };
        await addDoc(participantRef, participantData);
      }

      return true;
    } catch (error) {
      console.error('企画参加エラー:', error);
      throw error;
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const data = campaignSnap.data();
        return {
          id: campaignSnap.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as Campaign;
      }
      return null;
    } catch (error) {
      console.error('企画取得エラー:', error);
      throw error;
=======
      // キャンペーン情報を取得
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return {
          success: false,
          error: 'キャンペーンが見つかりません'
        };
      }

      const campaignData = campaignDoc.data();
      
      // キャンペーンの状態をチェック
      if (campaignData.status !== 'active') {
        return {
          success: false,
          error: 'このキャンペーンは現在参加できません'
        };
      }

      // 参加者数の上限をチェック
      if (campaignData.maxParticipants && campaignData.participantCount >= campaignData.maxParticipants) {
        return {
          success: false,
          error: '参加者数が上限に達しています'
        };
      }

      // 参加者情報を作成
      const participationResult = await participationService.createParticipation(
        userId,
        campaignId,
        campaignData.hostId,
        referralSource
      );

      if (!participationResult.success) {
        return participationResult;
      }

      return {
        success: true,
        message: 'キャンペーンに正常に参加しました'
      };
    } catch (error) {
      console.error('キャンペーン参加エラー:', error);
      return {
        success: false,
        error: 'キャンペーンへの参加中にエラーが発生しました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    }
  }

  // 抽選の実行（新しいデータ構造対応）
  async drawWinners(
    campaignId: string, 
    winnerCount: number,
    hostId: string
  ): Promise<ApiResponse<string[]>> {
    try {
<<<<<<< HEAD
      const participantsRef = collection(db, 'campaigns', campaignId, 'participants');
      const snapshot = await getDocs(participantsRef);
      
      const participants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (participants.length === 0) {
        throw new Error('参加者がいません');
      }

      const shuffled = participants.sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, Math.min(winnerCount, participants.length));

      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        winners: winners.map(w => w.userId),
        status: 'completed'
      });

      return winners;
    } catch (error) {
      console.error('抽選エラー:', error);
      throw error;
=======
      // キャンペーン情報を取得
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return {
          success: false,
          error: 'キャンペーンが見つかりません'
        };
      }

      const campaignData = campaignDoc.data();
      
      // ホストの権限をチェック
      if (campaignData.hostId !== hostId) {
        return {
          success: false,
          error: 'このキャンペーンの抽選を実行する権限がありません'
        };
      }

      // 参加者を取得
      const participantsResult = await participationService.getCampaignParticipants(campaignId);
      if (!participantsResult.success || !participantsResult.data) {
        return {
          success: false,
          error: '参加者情報の取得に失敗しました'
        };
      }

      const participants = participantsResult.data;
      
      if (participants.length < winnerCount) {
        return {
          success: false,
          error: `参加者数（${participants.length}人）が当選者数（${winnerCount}人）より少ないです`
        };
      }

      // ランダムに当選者を選出
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, winnerCount);
      const winnerIds = winners.map(w => w.userId);

      // 当選者情報を更新
      for (const winner of winners) {
        await participationService.setWinner(winner.userId, campaignId, true);
      }

      // キャンペーンのステータスを更新
      await updateDoc(doc(db, 'campaigns', campaignId), {
        status: 'completed',
        winnerCount: winnerIds.length,
        updatedAt: Timestamp.fromDate(new Date())
      });

      return {
        success: true,
        data: winnerIds,
        message: `${winnerIds.length}人の当選者が決定しました`
      };
    } catch (error) {
      console.error('抽選エラー:', error);
      return {
        success: false,
        error: '抽選の実行中にエラーが発生しました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    }
  }

  // キャンペーン一覧の取得（フィルタリング・ページネーション対応）
  async getCampaigns(
    filter?: CampaignFilter,
    sortOptions?: SortOptions,
    limit: number = 20,
    startAfter?: any
  ): Promise<PaginatedResponse<Campaign>> {
    try {
<<<<<<< HEAD
      const campaignsRef = collection(db, 'campaigns');
      const q = hostId 
        ? query(campaignsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'))
        : query(campaignsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Campaign[];
    } catch (error) {
      console.error('企画取得エラー:', error);
      throw error;
    }
  }

  subscribeToCampaigns(callback: (campaigns: Campaign[]) => void, hostId?: string) {
    const campaignsRef = collection(db, 'campaigns');
    const q = hostId 
      ? query(campaignsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'))
      : query(campaignsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Campaign[];
=======
      let q = query(collection(db, 'campaigns'));
      
      // フィルタリング
      if (filter) {
        if (filter.hostId) {
          q = query(q, where('hostId', '==', filter.hostId));
        }
        if (filter.status) {
          q = query(q, where('status', '==', filter.status));
        }
        if (filter.startDate) {
          q = query(q, where('startDate', '>=', Timestamp.fromDate(filter.startDate)));
        }
        if (filter.endDate) {
          q = query(q, where('endDate', '<=', Timestamp.fromDate(filter.endDate)));
        }
      }
      
      // ソート
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }
      
      // ページネーション
      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }
      q = query(q, limit(limit + 1)); // +1 to check if there are more items
      
      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          drawDate: data.drawDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Campaign;
      });
      
      const hasMore = snapshot.docs.length > limit;
      const lastDoc = campaigns.length > 0 ? snapshot.docs[campaigns.length - 1] : null;
      
      return {
        success: true,
        data: campaigns,
        pagination: {
          hasMore,
          lastDoc,
          total: campaigns.length
        }
      };
    } catch (error) {
      console.error('キャンペーン取得エラー:', error);
      return {
        success: false,
        error: 'キャンペーンの取得中にエラーが発生しました',
        data: [],
        pagination: {
          hasMore: false,
          lastDoc: null,
          total: 0
        }
      };
    }
  }

  // キャンペーンのリアルタイム監視
  subscribeToCampaigns(
    hostId: string, 
    callback: (campaigns: Campaign[]) => void,
    filter?: CampaignFilter
  ) {
    let q = query(collection(db, 'campaigns'), where('hostId', '==', hostId));
    
    // 追加フィルタリング
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          drawDate: data.drawDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Campaign;
      });
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
      
      callback(campaigns);
    });
  }

  // キャンペーンステータスの更新
  async updateCampaignStatus(
    campaignId: string, 
    status: Campaign['status'],
    hostId: string
  ): Promise<ApiResponse<void>> {
    try {
<<<<<<< HEAD
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, { status });
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      throw error;
=======
      // キャンペーン情報を取得してホスト権限をチェック
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return {
          success: false,
          error: 'キャンペーンが見つかりません'
        };
      }

      const campaignData = campaignDoc.data();
      if (campaignData.hostId !== hostId) {
        return {
          success: false,
          error: 'このキャンペーンを更新する権限がありません'
        };
      }

      await updateDoc(doc(db, 'campaigns', campaignId), {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });

      return {
        success: true,
        message: 'キャンペーンステータスが更新されました'
      };
    } catch (error) {
      console.error('キャンペーンステータス更新エラー:', error);
      return {
        success: false,
        error: 'ステータスの更新中にエラーが発生しました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    }
  }

  // キャンペーンの削除
  async deleteCampaign(
    campaignId: string,
    hostId: string
  ): Promise<ApiResponse<void>> {
    try {
<<<<<<< HEAD
      const campaignRef = doc(db, 'campaigns', campaignId);
      await deleteDoc(campaignRef);
    } catch (error) {
      console.error('企画削除エラー:', error);
      throw error;
=======
      // キャンペーン情報を取得してホスト権限をチェック
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (!campaignDoc.exists()) {
        return {
          success: false,
          error: 'キャンペーンが見つかりません'
        };
      }

      const campaignData = campaignDoc.data();
      if (campaignData.hostId !== hostId) {
        return {
          success: false,
          error: 'このキャンペーンを削除する権限がありません'
        };
      }

      // 関連データも削除
      await Promise.all([
        deleteDoc(doc(db, 'campaigns', campaignId)),
        // 参加者データは participationService で管理されているため、そちらで削除
        // リンクデータも linkTrackingService で管理されているため、そちらで削除
      ]);

      return {
        success: true,
        message: 'キャンペーンが削除されました'
      };
    } catch (error) {
      console.error('キャンペーン削除エラー:', error);
      return {
        success: false,
        error: 'キャンペーンの削除中にエラーが発生しました'
      };
>>>>>>> 0532816 (feat: 不要ファイル削除、認証システム改善、マイページ作成、CLIディレクトリ構築、Playwrightテスト環境構築)
    }
  }
}

export const campaignService = new CampaignService();