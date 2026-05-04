import React from 'react';
import { Languages, Search, LogOut, User, Menu, Building } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

export default function Header({ onMenuClick }) {
  const { toggleLanguage, t, language } = useLanguage();
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="header">
      <button className="hamburger-btn" onClick={onMenuClick}>
        <Menu size={24} />
      </button>

      <div className="header-logo-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
          <Building size={20} />
          <span>{language === 'ar' ? 'عقاري مانجر' : 'Aqari Manager'}</span>
        </div>
      </div>

      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder={t('search')} className="search-input" />
      </div>

      <div className="header-actions">
        <button onClick={toggleLanguage} className="icon-button" title="Toggle Language">
          <Languages size={20} />
        </button>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{currentUser?.email}</div>
            <div style={{ color: userRole === 'admin' ? '#2563eb' : '#6b7280', fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {userRole}
            </div>
          </div>
          <div className="avatar">
            <User size={18} />
          </div>
          <button onClick={handleLogout} className="icon-button" title="Log Out" style={{ marginLeft: '0.5rem' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
