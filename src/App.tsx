import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useOffline, useOfflineSync } from './hooks/useOffline'
import TabNavigation from './components/Layout/TabNavigation'
import Register from './pages/Register'
import Home from './pages/Home'
import Talk from './pages/Talk'
import Settings from './pages/Settings'
import './App.css'

const App: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { isOnline } = useOffline()
  const { processPendingActions } = useOfflineSync()

  useEffect(() => {
    if (isOnline) {
      processPendingActions()
    }
  }, [isOnline, processPendingActions])

  return (
    <Router>
      <div className="app">
        <main className="main-content">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route 
              path="/home" 
              element={isAuthenticated ? <Home /> : <Navigate to="/register" />} 
            />
            <Route 
              path="/talk" 
              element={isAuthenticated ? <Talk /> : <Navigate to="/register" />} 
            />
            <Route 
              path="/settings" 
              element={isAuthenticated ? <Settings /> : <Navigate to="/register" />} 
            />
            <Route path="/" element={<Navigate to="/register" />} />
          </Routes>
        </main>
        
        {isAuthenticated && <TabNavigation />}
      </div>
    </Router>
  )
}

export default App