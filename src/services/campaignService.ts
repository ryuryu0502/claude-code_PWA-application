import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface Campaign {
  id: string
  title: string
  description: string
  prize: string
  hostId: string
  hostName: string
  startDate: Date
  endDate: Date
  maxParticipants?: number
  participants: string[]
  winners: string[]
  status: 'draft' | 'active' | 'ended' | 'completed'
  createdAt: Date
}

export interface CampaignParticipant {
  campaignId: string
  userId: string
  joinedAt: Date
  installLink?: string
}

export class CampaignService {
  async createCampaign(campaign: Omit<Campaign, 'id' | 'participants' | 'winners' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'campaigns'), {
        ...campaign,
        participants: [],
        winners: [],
        createdAt: serverTimestamp(),
        status: 'draft'
      })
      return docRef.id
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.error('Firestoreセキュリティルールにより拒否:', error);
        throw new Error('企画を作成する権限がありません。ホストとして登録されているか確認してください。');
      }
      console.error('企画作成エラー:', error)
      throw new Error('企画の作成中に不明なエラーが発生しました。');
    }
  }

  async joinCampaign(campaignId: string, userId: string, installLink?: string) {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId)
      const participantData = {
        campaignId,
        userId,
        joinedAt: serverTimestamp(),
        installLink
      }

      // Add to participants subcollection
      await addDoc(collection(db, 'campaigns', campaignId, 'participants'), participantData)

      return true
    } catch (error) {
      console.error('企画参加エラー:', error)
      throw error
    }
  }

  async drawWinners(campaignId: string, winnerCount: number = 1) {
    try {
      const participantsRef = collection(db, 'campaigns', campaignId, 'participants')
      const snapshot = await getDocs(participantsRef)
      
      const participants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      if (participants.length === 0) {
        throw new Error('参加者がいません')
      }

      // Shuffle and select winners
      const shuffled = participants.sort(() => 0.5 - Math.random())
      const winners = shuffled.slice(0, Math.min(winnerCount, participants.length))

      // Update campaign with winners
      const campaignRef = doc(db, 'campaigns', campaignId)
      await updateDoc(campaignRef, {
        winners: winners.map(w => w.userId),
        status: 'completed'
      })

      return winners
    } catch (error) {
      console.error('抽選エラー:', error)
      throw error
    }
  }

  async getCampaigns(hostId?: string) {
    try {
      const campaignsRef = collection(db, 'campaigns')
      const q = hostId 
        ? query(campaignsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'))
        : query(campaignsRef, orderBy('createdAt', 'desc'))

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Campaign[]
    } catch (error) {
      console.error('企画取得エラー:', error)
      throw error
    }
  }

  subscribeToCampaigns(callback: (campaigns: Campaign[]) => void, hostId?: string) {
    const campaignsRef = collection(db, 'campaigns')
    const q = hostId 
      ? query(campaignsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'))
      : query(campaignsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'))

    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Campaign[]
      
      callback(campaigns)
    })
  }

  async updateCampaignStatus(campaignId: string, status: Campaign['status']) {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId)
      await updateDoc(campaignRef, { status })
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      throw error
    }
  }

  async deleteCampaign(campaignId: string) {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId)
      await deleteDoc(campaignRef)
    } catch (error) {
      console.error('企画削除エラー:', error)
      throw error
    }
  }
}

export const campaignService = new CampaignService()