import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import '../../components/ActionMenu.css';
import './Buildings.css';

  export default function BuildingsList() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { buildings, addBuilding, deleteBuilding } = useProperty();
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';
  
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBuilding, setNewBuilding] = useState({ name: '', location: '', type: 'Commercial', flatsCount: '', shopsCount: '', officesCount: '' });
  
    const handleAddBuilding = (e) => {
      e.preventDefault();
      if (!newBuilding.name || !newBuilding.location) return;
      addBuilding(newBuilding);
      setIsModalOpen(false);
      setNewBuilding({ name: '', location: '', type: 'Commercial', flatsCount: '', shopsCount: '', officesCount: '' });
    };
  
    return (
      <div className="buildings-page">
        <div className="page-header">
          <h1 className="page-title">{t('buildingsOverview')}</h1>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('addBuilding')}</button>
        </div>
  
        <div className="buildings-grid">
          {buildings.map(building => {
            const totalUnits = building.units.length;
            const leasedUnits = building.units.filter(u => u.status === 'Leased').length;
            const occupancyRate = totalUnits > 0 ? Math.round((leasedUnits / totalUnits) * 100) : 0;
  
            return (
              <div
                key={building.id}
                className="glass-panel building-card"
                onClick={() => navigate(`/buildings/${building.id}`)}
                role="button"
              >
                <div className="building-card-header">
                  <div className="building-icon">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  {isAdmin && (
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this building?')) deleteBuilding(building.id); }}>
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  )}
                </div>
  
                <div className="building-info">
                  <h3 className="building-name">{building.name}</h3>
                  <p className="building-location">
                    <MapPin size={14} />
                    {building.location}
                  </p>
                  <span className="building-type">
                    {t(building.type) || building.type}
                  </span>
                </div>
  
                <div className="building-stats">
                  <div className="stat-row">
                    <span className="stat-label">{t('occupancy')}</span>
                    <span className="stat-value">{occupancyRate}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${occupancyRate > 90 ? 'bg-success' : occupancyRate > 50 ? 'bg-primary' : 'bg-warning'}`}
                      style={{ width: `${Math.max(occupancyRate, 2)}%` }}
                    ></div>
                  </div>
                  <div className="stat-row text-xs mt-1">
                    <span className="text-secondary">{leasedUnits} {t('leased')}</span>
                    <span className="text-secondary">{totalUnits - leasedUnits} {t('available')}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {buildings.length === 0 && (
            <div className="glass-panel empty-state-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
              <div className="empty-icon" style={{ marginBottom: '1.5rem', opacity: 0.3 }}>
                <Building2 size={64} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{t('noBuildingsFound')}</h3>
              <p className="text-secondary">{t('dashboardSubtitle')}</p>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '2rem' }}>
                {t('addBuilding')}
              </button>
            </div>
          )}
        </div>
  
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('addBuilding')}>
          <form onSubmit={handleAddBuilding} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>{t('buildingName')}</label>
              <input required type="text" className="form-input" placeholder="e.g. Al Olaya Tower"
                value={newBuilding.name} onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input required type="text" className="form-input" placeholder="e.g. King Fahd Branch Rd"
                value={newBuilding.location} onChange={(e) => setNewBuilding({...newBuilding, location: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('buildingType')}</label>
              <select className="form-input" value={newBuilding.type} onChange={(e) => setNewBuilding({...newBuilding, type: e.target.value})}>
                <option value="Commercial">{t('commercial')}</option>
                <option value="Office">{t('office')}</option>
                <option value="Retail">{t('retail')}</option>
                <option value="Residential">{t('residential')}</option>
                <option value="Mixed Use">{t('mixedUse')}</option>
              </select>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Automatically generate units inside this building (Optional):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}># Flats</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 25"
                    value={newBuilding.flatsCount} onChange={(e) => setNewBuilding({...newBuilding, flatsCount: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}># Shops</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 5"
                    value={newBuilding.shopsCount} onChange={(e) => setNewBuilding({...newBuilding, shopsCount: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}># Offices</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 10"
                    value={newBuilding.officesCount} onChange={(e) => setNewBuilding({...newBuilding, officesCount: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{t('saveBuilding')}</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }
