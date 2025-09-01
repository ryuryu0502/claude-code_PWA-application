import { useState, useEffect } from 'react'

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline }
}

export const useOfflineSync = () => {
  const [pendingActions, setPendingActions] = useState<any[]>([])

  const addPendingAction = (action: any) => {
    setPendingActions(prev => [...prev, action])
    localStorage.setItem('pendingActions', JSON.stringify([...pendingActions, action]))
  }

  const processPendingActions = async () => {
    const stored = localStorage.getItem('pendingActions')
    if (stored) {
      const actions = JSON.parse(stored)
      for (const action of actions) {
        try {
          await action.execute()
        } catch (error) {
          console.error('オフライン同期エラー:', error)
        }
      }
      localStorage.removeItem('pendingActions')
      setPendingActions([])
    }
  }

  return { addPendingAction, processPendingActions }
}