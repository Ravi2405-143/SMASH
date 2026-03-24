import React from 'react';
import { Activity, Menu } from 'lucide-react';
import './Header.css';

export function Header() {
  return (
    <header className="header glass-panel">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo-icon-wrapper">
            <Activity className="logo-icon" size={24} color="#ffffff" />
          </div>
          <h1 className="logo-text">Smash<span className="text-gradient">Analyzer</span></h1>
        </div>
        
        <nav className="desktop-nav">
          <a href="#" className="nav-link active">Analyzer</a>
          <a href="#" className="nav-link">History</a>
          <a href="#" className="nav-link">Settings</a>
          <button className="btn-secondary sign-in-btn">Sign In</button>
        </nav>

        <button className="mobile-menu-btn">
          <Menu size={24} color="var(--text-primary)" />
        </button>
      </div>
    </header>
  );
}
