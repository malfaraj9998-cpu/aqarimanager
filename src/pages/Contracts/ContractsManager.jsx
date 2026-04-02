import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useContract } from '../../context/ContractContext';
import { useClient } from '../../context/ClientContext';
import { useProperty } from '../../context/PropertyContext';
import { FileSignature, FileText, Search, Plus } from 'lucide-react';
import './Contracts.css';

export default function ContractsManager() {
  const { t, formatDateDual } = useLanguage();
  const navigate = useNavigate();
  const { activeContracts, archivedContracts } = useContract();
  const { clients } = useClient();
  const { buildings } = useProperty();

  const [activeTab, setActiveTab] = useState('Active');
  const [searchTerm, setSearchTerm] = useState('');

  const displayedContracts = activeTab === 'Active' ? activeContracts : archivedContracts;

  const filtered = useMemo(() => {
    return displayedContracts.filter(c => {
      if (!searchTerm) return true;
      const client = clients.find(cl => cl.id === c.clientId);
      const searchLower = searchTerm.toLowerCase();
      
      const matchSearch = 
        (c.contractNumber && c.contractNumber.toLowerCase().includes(searchLower)) ||
        (c.ejarContractNumber && c.ejarContractNumber.toLowerCase().includes(searchLower)) ||
        (client && client.name && client.name.toLowerCase().includes(searchLower));
      
      return matchSearch;
    });
  }, [displayedContracts, searchTerm, clients]);

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1 className="page-title">{t('contractsLedger')}</h1>
        <button className="btn-primary" onClick={() => navigate('/contracts/new')}>
          <Plus size={18} style={{ display: 'inline', marginInlineEnd: '4px' }}/> 
          {t('newContract')}
        </button>
      </div>

      <div className="glass-panel main-panel">
        <div className="panel-toolbar" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
          <div className="tabs" style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
            <button 
              className={`tab-btn ${activeTab === 'Active' ? 'active text-primary' : 'text-secondary'}`}
              style={{ paddingBottom: '0.75rem', position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setActiveTab('Active')}
            >
              {t('active')}
              <span className="badge" style={{ marginInlineStart: '6px', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                {activeContracts.length}
              </span>
              {activeTab === 'Active' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', backgroundColor: 'var(--primary-color)' }} />}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'Archived' ? 'active text-primary' : 'text-secondary'}`}
              style={{ paddingBottom: '0.75rem', position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setActiveTab('Archived')}
            >
              {t('archivedLedger')}
              <span className="badge" style={{ marginInlineStart: '6px', backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                {archivedContracts.length}
              </span>
              {activeTab === 'Archived' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', backgroundColor: 'var(--primary-color)' }} />}
            </button>
          </div>
          <div className="search-bar" style={{ minWidth: '250px' }}>
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder={t('searchContracts')} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
        </div>

        <div className="table-responsive">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t('contractIdEjar')}</th>
                <th>{t('client')}</th>
                <th>{t('propertyUnit')}</th>
                <th>{t('period')}</th>
                <th>{t('annualRentAmount')}</th>
                <th>{t('status')}</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => {
                const client = clients.find(c => c.id === contract.clientId);
                const building = buildings.find(b => b.id === contract.buildingId);
                const unit = building?.units.find(u => u.id.toString() === contract.unitId.toString());
                
                return (
                  <tr key={contract.id} className="clickable-row">
                    <td>
                      <div className="font-medium text-primary">#{contract.contractNumber}</div>
                      <div className="text-secondary text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} /> {contract.ejarContractNumber || t('noEjar')}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{client?.name || t('unknownClient')}</div>
                    </td>
                    <td>
                      <div className="font-medium">{building?.name || '—'}</div>
                      <div className="text-secondary text-xs">Unit {unit?.unitNumber || contract.unitId} ({unit?.type || '—'})</div>
                    </td>
                    <td>
                      <div className="font-mono text-sm">{formatDateDual(contract.startDate)}</div>
                      <div className="font-mono text-sm text-secondary">to {formatDateDual(contract.endDate)}</div>
                    </td>
                    <td className="font-medium">
                      {t('currencySAR') || 'SAR'} {parseInt(contract.annualRent || 0).toLocaleString()}
                      <div className="text-xs text-secondary">{t(contract.paymentFrequency) || contract.paymentFrequency}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${contract.status === 'Active' ? 'active' : 'expired'}`}>
                        {contract.status === 'Active' ? t('active') : t('expired')}
                      </span>
                    </td>
                    <td>
                      {contract.status === 'Active' && (
                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/contracts/new?renewId=${contract.id}`); }}>
                          {t('renew')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center empty-state">{activeTab === 'Active' ? t('noActiveContractsFound') : t('noArchivedContractsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
