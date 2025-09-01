// Firebase configuration and service initialization
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, TwitterAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'

// Firebase project configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-ZNETML2MEJ"
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Export Firebase services for use throughout the application
export const auth = getAuth(app)
export const db = getFirestore(app)
export const messaging = getMessaging(app)
export const googleProvider = new GoogleAuthProvider()
export const twitterProvider = new TwitterAuthProvider()

export default app