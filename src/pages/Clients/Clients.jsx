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
  const [formData, setFormData] = useState({
    name: '', type: 'Individual', nationality: 'المملكة العربية السعودية',
    idType: 'هوية وطنية', vat: '', mobile: '', email: '',
    nationalAddress: '', selfRepresented: true,
  });

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
      const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.vat || '').includes(searchTerm) ||
        (c.mobile || '').includes(searchTerm);
      const matchStatus = !filterStatus || c.computedStatus === filterStatus;
      const matchType = !filterType || c.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [clients, searchTerm, filterStatus, filterType, activeContracts, archivedContracts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addClient(formData);
    setIsModalOpen(false);
    setFormData({ name: '', type: 'Individual', nationality: 'المملكة العربية السعودية', idType: 'هوية وطنية', vat: '', mobile: '', email: '', nationalAddress: '', selfRepresented: true });
  };

  const handleExport = () => {
    const data = clients.map(c => ({
      'Name / الاسم': c.name, 'Type': c.type,
      'ID Type / نوع الهوية': c.idType || '',
      'ID No. / رقم الهوية': c.vat,
      'Mobile / الجوال': c.mobile, 'Email': c.email,
      'Nationality / الجنسية': c.nationality,
      'National Address / العنوان الوطني': c.nationalAddress || '',
      'Status': c.computedStatus,
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
                <th>نوع الهوية / ID Type</th>
                <th>رقم الهوية / ID No.</th>
                <th>{t('contactInfo')}</th>
                <th>العنوان الوطني</th>
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
                  <td className="text-secondary" style={{ fontSize: '0.82rem' }}>{client.idType || '—'}</td>
                  <td className="font-mono">{client.vat || '—'}</td>
                  <td className="text-secondary">
                    <div style={{ fontSize: '0.85rem' }}>{client.mobile || '—'}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{client.email || '—'}</div>
                  </td>
                  <td className="text-secondary" style={{ fontSize: '0.82rem', direction: 'rtl', textAlign: 'right' }}>
                    {client.nationalAddress || '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${client.computedStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                      {client.computedStatus === 'Active' ? t('active') : client.computedStatus === 'Expired' ? t('expired') : t('noContract')}
                    </span>
                  </td>
                  <td>
                    <ChevronRight size={16} className="text-secondary" style={{ opacity: 0.5 }} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center empty-state">{t('noClientsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('registerNewClient')}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ padding: '0.6rem 1rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
            👤 بيانات المستأجر — Tenant Data (Section 4)
          </div>

          <div className="form-group">
            <label>الاسم الكامل / Full Name</label>
            <input required type="text" className="form-input" placeholder="e.g. محمد ابراهيم عبدالعزيز الفرج"
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
              <label>الجنسية / Nationality</label>
              <input type="text" className="form-input" placeholder="e.g. المملكة العربية السعودية"
                value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>نوع الهوية / ID Type</label>
              <select className="form-input" value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})}>
                <option value="هوية وطنية">هوية وطنية — National ID</option>
                <option value="إقامة">إقامة — Residency</option>
                <option value="جواز سفر">جواز سفر — Passport</option>
                <option value="سجل تجاري">سجل تجاري — CR</option>
              </select>
            </div>
            <div className="form-group">
              <label>رقم الهوية / ID No.</label>
              <input required type="text" className="form-input" placeholder="e.g. 1066484872"
                value={formData.vat} onChange={(e) => setFormData({...formData, vat: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>رقم الجوال / Mobile</label>
              <input type="tel" className="form-input" placeholder="+9665xxxxxxxx"
                value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
            </div>
            <div className="form-group">
              <label>البريد الإلكتروني / Email</label>
              <input type="email" className="form-input" placeholder="contact@domain.com"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>العنوان الوطني / National Address</label>
            <input type="text" className="form-input" placeholder="e.g. الرياض, الرياض"
              value={formData.nationalAddress} onChange={(e) => setFormData({...formData, nationalAddress: e.target.value})} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <input type="checkbox" checked={formData.selfRepresented}
              onChange={(e) => setFormData({...formData, selfRepresented: e.target.checked})}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
            <span style={{ fontSize: '0.875rem' }}>
              المستأجر مُمثَّل بنفسه — <span style={{ opacity: 0.7 }}>Tenant represented by himself/herself</span>
            </span>
          </label>

          <div className="modal-actions" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
            <button type="submit" className="btn-primary">{t('saveClient')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
