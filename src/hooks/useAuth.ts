import { useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { campaignService } from '../services/campaignService';

export const useAuth = () => {
  const { user, setUser, loadUserProfile } = useAuthStore();

  const handleCampaignJoin = async (userId: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('ref');
    if (campaignId) {
      try {
        await campaignService.joinCampaign(campaignId, userId, campaignId);
        console.log(`Joined campaign ${campaignId}`);
        // Optionally, remove the ref from the URL to prevent re-joining
        // window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to auto-join campaign:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user.uid);
        await handleCampaignJoin(user.uid);
      }
    });

    return () => unsubscribe();
  }, [setUser, loadUserProfile]);

  const createUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const urlParams = new URLSearchParams(window.location.search);
      const installLink = urlParams.get('ref') || 'direct';

      await setDoc(userRef, {
        id: user.uid,
        nickname: user.displayName || 'ユーザー',
        avatar: user.photoURL,
        installLink,
        createdAt: new Date(),
        notificationEnabled: false,
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      await handleCampaignJoin(result.user.uid);
      return result.user;
    } catch (error) {
      console.error('Googleログインエラー:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user);
      await handleCampaignJoin(result.user.uid);
      return result.user;
    } catch (error) {
      console.error('メール登録エラー:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleCampaignJoin(result.user.uid);
      return result.user;
    } catch (error) {
      console.error('メールログインエラー:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  };

  return {
    user,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    isAuthenticated: !!user,
  };
};
