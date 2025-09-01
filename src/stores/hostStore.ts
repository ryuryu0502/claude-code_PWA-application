import { create } from 'zustand'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

interface HostProfile {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  campaignCount: number
}

interface HostState {
  hostProfile: HostProfile | null
  isHost: boolean
  isLoading: boolean
  setHostProfile: (profile: HostProfile | null) => void
  loadHostProfile: (userId: string) => Promise<void>
  createHostProfile: (userId: string, data: Partial<HostProfile>) => Promise<void>
  updateHostProfile: (updates: Partial<HostProfile>) => Promise<void>
}

export const useHostStore = create<HostState>((set, get) => ({
  hostProfile: null,
  isHost: false,
  isLoading: false,
  
  setHostProfile: (profile) => set({ 
    hostProfile: profile, 
    isHost: !!profile 
  }),
  
  loadHostProfile: async (userId: string) => {
    set({ isLoading: true })
    try {
      const docRef = doc(db, 'hosts', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        set({ 
          hostProfile: {
            ...data,
            createdAt: data.createdAt.toDate()
          } as HostProfile,
          isHost: true,
          isLoading: false 
        })
      } else {
        set({ hostProfile: null, isHost: false, isLoading: false })
      }
    } catch (error) {
      console.error('ホストプロフィール読み込みエラー:', error)
      set({ isLoading: false })
    }
  },
  
  createHostProfile: async (userId: string, data: Partial<HostProfile>) => {
    try {
      const hostData = {
        id: userId,
        name: data.name || 'ホスト',
        email: data.email || '',
        avatar: data.avatar || '',
        createdAt: new Date(),
        campaignCount: 0,
        ...data
      }
      
      const docRef = doc(db, 'hosts', userId)
      await setDoc(docRef, hostData)
      set({ hostProfile: hostData, isHost: true })
    } catch (error) {
      console.error('ホストプロフィール作成エラー:', error)
      throw error
    }
  },
  
  updateHostProfile: async (updates: Partial<HostProfile>) => {
    const { hostProfile } = get()
    if (!hostProfile) return
    
    try {
      const updatedProfile = { ...hostProfile, ...updates }
      const docRef = doc(db, 'hosts', hostProfile.id)
      await setDoc(docRef, updatedProfile, { merge: true })
      set({ hostProfile: updatedProfile })
    } catch (error) {
      console.error('ホストプロフィール更新エラー:', error)
    }
  }
}))