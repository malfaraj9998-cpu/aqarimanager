import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, Users, Building, Building2, FileSignature, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Sidebar() {
  const { t, language } = useLanguage();
  const { isSuperAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Building size={28} />
        <span>{language === 'ar' ? 'عقاري مانجر' : 'Aqari Manager'}</span>
      </div>
      
      <nav className="nav-menu">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>{t('dashboard')}</span>
        </NavLink>
        
        <NavLink to="/buildings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Building2 size={20} />
          <span>{t('buildings')}</span>
        </NavLink>

        <NavLink to="/contracts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileSignature size={20} />
          <span>{t('contracts')}</span>
        </NavLink>
        
        <NavLink to="/finance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <PieChart size={20} />
          <span>{t('finance')}</span>
        </NavLink>
        
        
        <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>{t('clients')}</span>
        </NavLink>

        {isSuperAdmin && (
          <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <ShieldAlert size={20} color="#fbbf24" />
            <span style={{ color: '#fbbf24' }}>System Admin</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
