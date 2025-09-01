// Custom hook for handling authentication with Google and Twitter
import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, twitterProvider, db } from '../firebase'
import { useAuthStore } from '../stores/authStore'

export const useAuth = () => {
  const { user, setUser, loadUserProfile } = useAuthStore()

  useEffect(() => {
    // Handle redirect result from Google sign-in
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

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadUserProfile(user.uid)
      }
    })

    return () => unsubscribe()
  }, [setUser, loadUserProfile])

  // Sign in with Google using redirect flow
  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error('Googleログインエラー:', error)
      throw error
    }
  }

  // Sign in with Twitter using popup flow
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

  // Create user profile in Firestore if it doesn't exist
  const createUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Track installation source from URL parameters
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

  // Sign out the current user
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