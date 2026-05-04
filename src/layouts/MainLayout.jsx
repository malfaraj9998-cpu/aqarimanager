import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Home, Building2, Users, PieChart, FileSignature } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="app-container">
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <div className="mobile-bottom-nav">
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>{t('dashboard')}</span>
          </NavLink>
          <NavLink to="/buildings" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Building2 size={20} />
            <span>{t('buildings')}</span>
          </NavLink>
          <NavLink to="/contracts" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <FileSignature size={20} />
            <span>{t('contracts')}</span>
          </NavLink>
          <NavLink to="/finance" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <PieChart size={20} />
            <span>{t('finance')}</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>{t('clients')}</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
