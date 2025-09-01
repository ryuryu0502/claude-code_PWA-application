import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, twitterProvider, db } from '../firebase'
import { useAuthStore } from '../stores/authStore'

export const useAuth = () => {
  const { user, setUser, loadUserProfile } = useAuthStore()

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          await createUserProfile(result.user)
        }
      } catch (error) {
        console.error('リダイレクト結果エラー:', error)
      }
    }

    handleRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadUserProfile(user.uid)
      }
    })

    return () => unsubscribe()
  }, [setUser, loadUserProfile])

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error('Googleログインエラー:', error)
      throw error
    }
  }

  const signInWithTwitter = async () => {
    try {
      const result = await signInWithPopup(auth, twitterProvider)
      await createUserProfile(result.user)
      return result.user
    } catch (error) {
      console.error('Xログインエラー:', error)
      throw error
    }
  }

  const createUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const urlParams = new URLSearchParams(window.location.search)
      const installLink = urlParams.get('ref') || 'direct'

      await setDoc(userRef, {
        id: user.uid,
        nickname: user.displayName || 'ユーザー',
        avatar: user.photoURL,
        installLink,
        createdAt: new Date(),
        notificationEnabled: false
      })
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  return {
    user,
    signInWithGoogle,
    signInWithTwitter,
    signOut,
    isAuthenticated: !!user
  }
}