import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOffline, useOfflineSync } from './hooks/useOffline';
import TabNavigation from './components/Layout/TabNavigation';
import InstallPrompt from './components/Common/InstallPrompt';
import InstallBanner from './components/Common/InstallBanner';
import Register from './pages/Register';
import Home from './pages/Home';
import Talk from './pages/Talk';
import Settings from './pages/Settings';
import HostDashboard from './pages/HostDashboard';
import CampaignDetail from './pages/CampaignDetail';
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useOffline();
  const { processPendingActions } = useOfflineSync();

  useEffect(() => {
    if (isOnline) {
      processPendingActions();
    }
  }, [isOnline, processPendingActions]);

  return (
    <Router>
      <div className="app">
        <InstallBanner />
        
        <main className="main-content">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/talk" element={<Talk />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/" element={<Navigate to="/home" />} />
          </Routes>
        </main>
        
        <TabNavigation />
        
        <InstallPrompt />
      </div>
    </Router>
  );
};

export default App;
