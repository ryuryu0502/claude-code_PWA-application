import { create } from 'zustand'
import { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

interface UserProfile {
  id: string
  nickname: string
  avatar?: string
  installLink?: string
  createdAt: Date
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  loadUserProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ profile }),
  
  loadUserProfile: async (userId: string) => {
    set({ isLoading: true })
    try {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        set({ 
          profile: {
            ...data,
            createdAt: data.createdAt.toDate()
          } as UserProfile,
          isLoading: false 
        })
      } else {
        set({ profile: null, isLoading: false })
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
      set({ isLoading: false })
    }
  },
  
  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) return
    
    try {
      const updatedProfile = { ...profile, ...updates }
      const docRef = doc(db, 'users', user.uid)
      await setDoc(docRef, updatedProfile, { merge: true })
      set({ profile: updatedProfile })
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
    }
  }
}))