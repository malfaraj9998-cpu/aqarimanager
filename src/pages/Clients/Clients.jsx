import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useClient } from '../../context/ClientContext';
import { useContract } from '../../context/ContractContext';
import Modal from '../../components/Modal';
import { exportToExcel } from '../../utils/exportToExcel';
import './Clients.css';

export default function Clients() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clients, addClient } = useClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Retail', vat: '', mobile: '', email: '', nationality: '' });

  const { activeContracts, archivedContracts } = useContract();

  const filtered = useMemo(() => {
    // First map all clients to compute their real-time contract status
    const clientsWithStatus = clients.map(c => {
      const hasActive = activeContracts.some(contract => contract.clientId === c.id);
      const hasArchived = archivedContracts.some(contract => contract.clientId === c.id);
      
      let computedStatus = 'No Active Contract';
      if (hasActive) {
        computedStatus = 'Active';
      } else if (hasArchived) {
        computedStatus = 'Expired';
      }

      return { ...c, computedStatus };
    });

    return clientsWithStatus.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vat.includes(searchTerm) ||
        (c.mobile && c.mobile.includes(searchTerm));
      const matchStatus = !filterStatus || c.computedStatus === filterStatus;
      const matchType = !filterType || c.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [clients, searchTerm, filterStatus, filterType, activeContracts, archivedContracts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addClient(formData);
    setIsModalOpen(false);
    setFormData({ name: '', type: 'Retail', vat: '', mobile: '', email: '', nationality: '' });
  };

  const handleExport = () => {
    const data = clients.map(c => ({
      'Name': c.name, 'Type': c.type, 'ID/VAT': c.vat,
      'Mobile': c.mobile, 'Email': c.email, 'Nationality': c.nationality,
      'Contract Start': c.contractStart, 'Contract End': c.contractEnd, 'Status': c.status,
    }));
    exportToExcel(data, 'Clients', 'aqari-clients-export');
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">{t('clientsContracts')}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="filter-btn" onClick={handleExport}>
            <Download size={18} />
            <span>{t('Export')}</span>
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('addNewClient')}</button>
        </div>
      </div>

      <div className="glass-panel main-panel">
        <div className="panel-toolbar">
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder={t('searchClients')} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
          <button className={`filter-btn ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter(!showFilter)}>
            {showFilter ? <X size={18} /> : <Filter size={18} />}
            <span>{t('filter')}</span>
          </button>
        </div>

        {showFilter && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>{t('status')}</label>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Active">{t('active')}</option>
                <option value="Expired">{t('expired')}</option>
                <option value="No Active Contract">{t('noContract')}</option>
              </select>
            </div>
            <div className="filter-group">
              <label>{t('clientType')}</label>
              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Individual">{t('individual')}</option>
                <option value="Retail">{t('retailBusiness')}</option>
                <option value="F&B">{t('foodBev')}</option>
                <option value="Tech Corporation">{t('techCorp')}</option>
                <option value="Telecommunications">{t('telecom')}</option>
              </select>
            </div>
            <button className="filter-reset-btn" onClick={() => { setFilterStatus(''); setFilterType(''); }}>
              Reset Filters
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t('tenantName')}</th>
                <th>{t('clientType')}</th>
                <th>{t('idVatNumber')}</th>
                <th>{t('contactInfo')}</th>
                <th>{t('status')}</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="clickable-row"
                  onClick={() => navigate(`/clients/${client.id}`)}
                  title="Click to view & edit client details"
                >
                  <td>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-secondary text-xs">{client.nationality}</div>
                  </td>
                  <td className="text-secondary">{t(client.type) || client.type}</td>
                  <td className="font-mono">{client.vat}</td>
                  <td className="text-secondary">
                    <div style={{ fontSize: '0.85rem' }}>{client.mobile || '—'}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{client.email || '—'}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${client.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {client.status === 'Active' ? t('active') : client.status === 'Expired' ? t('expired') : t('noContract')}
                    </span>
                  </td>
                  <td>
                    <ChevronRight size={16} className="text-secondary" style={{ opacity: 0.5 }} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center empty-state">{t('noClientsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('registerNewClient')}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>{t('fullNameCompany')}</label>
            <input required type="text" className="form-input" placeholder="e.g. Ahmed Al-Farsi"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('clientType')}</label>
              <select className="form-input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="Individual">{t('individual')}</option>
                <option value="Retail">{t('retailBusiness')}</option>
                <option value="F&B">{t('foodBev')}</option>
                <option value="Tech Corporation">{t('techCorp')}</option>
                <option value="Other">{t('otherEntity')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('nationality')}</label>
              <input type="text" className="form-input" placeholder="e.g. Saudi Arabia"
                value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>{t('idVatNumber')}</label>
            <input required type="text" className="form-input" placeholder="e.g. 10xxxxxxxx"
              value={formData.vat} onChange={(e) => setFormData({...formData, vat: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('mobileNumber')}</label>
              <input type="tel" className="form-input" placeholder="+9665xxxxxxxx"
                value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('emailAddress')}</label>
              <input type="email" className="form-input" placeholder="contact@domain.com"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div className="modal-actions" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
            <button type="submit" className="btn-primary">{t('saveClient')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
