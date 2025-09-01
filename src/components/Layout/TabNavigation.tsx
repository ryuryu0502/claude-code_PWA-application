import React from 'react'
import { NavLink } from 'react-router-dom'

const TabNavigation: React.FC = () => {
  return (
    <nav className="tab-navigation">
      <NavLink 
        to="/register" 
        className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon">📝</span>
        <span className="tab-label">登録</span>
      </NavLink>
      
      <NavLink 
        to="/home" 
        className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon">🏠</span>
        <span className="tab-label">ホーム</span>
      </NavLink>
      
      <NavLink 
        to="/talk" 
        className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon">💬</span>
        <span className="tab-label">トーク</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon">⚙️</span>
        <span className="tab-label">設定</span>
      </NavLink>
    </nav>
  )
}

export default TabNavigation