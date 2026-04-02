import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Building2, Phone, Mail, FileText, Globe, Hash } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useClient } from '../../context/ClientContext';
import { useContract } from '../../context/ContractContext';
import { useAuth } from '../../context/AuthContext';
import './Clients.css';

export default function ClientDetails() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { clients, loading, updateClient } = useClient();
  const { activeContracts, archivedContracts } = useContract();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const client = clients.find(c => c.id === id);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (client && !form) {
      setForm({ ...client });
    }
  }, [client, form]);

  if (loading) {
    return (
      <div className="clients-page">
        <div className="page-header">
          <h1 className="page-title">Loading client...</h1>
        </div>
      </div>
    );
  }

  if (!client || !form) {
    return (
      <div className="clients-page">
        <div className="page-header">
          <button className="icon-btn" onClick={() => navigate('/clients')}><ArrowLeft size={20} /></button>
          <h1 className="page-title">Client not found</h1>
        </div>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateClient(client.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Compute Status based purely on Contracts Ledger
  const hasActive = activeContracts.some(contract => contract.clientId === id);
  const hasArchived = archivedContracts.some(contract => contract.clientId === id);
  let computedStatus = 'No Active Contract';
  if (hasActive) {
    computedStatus = 'Active';
  } else if (hasArchived) {
    computedStatus = 'Expired';
  }

  const statusColor = computedStatus === 'Active' ? 'active' : computedStatus === 'Expired' ? 'expired' : 'pending';

  return (
    <div className="clients-page">
      <div className="page-header">
        <div className="header-breadcrumbs">
          <button className="icon-btn back-btn" onClick={() => navigate('/clients')}>
            <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
          <div>
            <h1 className="page-title">{form.name}</h1>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '2px' }}>
              {t(form.type) || form.type} &nbsp;·&nbsp;
              <span className={`status-badge ${statusColor}`}>{t(computedStatus) || computedStatus}</span>
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            type="submit"
            form="client-edit-form"
            className={`btn-primary ${saved ? 'saved-pulse' : ''}`}
          >
            {saved ? '✓ Saved!' : <><Save size={16} style={{ display: 'inline', marginInlineEnd: '6px' }} />{t('save')}</>}
          </button>
        )}
      </div>

      <form id="client-edit-form" onSubmit={handleSave}>
        <fieldset disabled={!isAdmin} style={{ border: 'none', padding: 0, margin: 0 }}>
        <div className="client-details-grid">

          {/* Basic Info */}
          <div className="glass-panel detail-card">
            <div className="detail-card-header">
              <User size={20} className="text-primary" />
              <h2>{t('clientInfo')}</h2>
            </div>
            <div className="detail-fields">
              <div className="form-group">
                <label>{t('fullNameCompany')}</label>
                <input type="text" className="form-input" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>{t('clientType')}</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="Individual">{t('individual')}</option>
                    <option value="Retail">{t('retailBusiness')}</option>
                    <option value="F&B">{t('foodBev')}</option>
                    <option value="Tech Corporation">{t('techCorp')}</option>
                    <option value="Telecommunications">{t('telecom')}</option>
                    <option value="Other">{t('otherEntity')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="glass-panel detail-card">
            <div className="detail-card-header">
              <Hash size={20} className="text-primary" />
              <h2>Identity & Registration</h2>
            </div>
            <div className="detail-fields">
              <div className="form-group">
                <label>{t('idVatNumber')}</label>
                <input type="text" className="form-input"
                  value={form.vat} onChange={e => setForm({...form, vat: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t('nationality')}</label>
                <input type="text" className="form-input"
                  value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="glass-panel detail-card">
            <div className="detail-card-header">
              <Phone size={20} className="text-primary" />
              <h2>{t('contactInfo')}</h2>
            </div>
            <div className="detail-fields">
              <div className="form-group">
                <label>{t('mobileNumber')}</label>
                <input type="tel" className="form-input" placeholder="+9665xxxxxxxx"
                  value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t('emailAddress')}</label>
                <input type="email" className="form-input" placeholder="contact@domain.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Notes — full width */}
          <div className="glass-panel detail-card detail-card-full">
            <div className="detail-card-header">
              <FileText size={20} className="text-primary" />
              <h2>{t('notes')}</h2>
            </div>
            <div className="detail-fields">
              <textarea
                className="form-input"
                rows={4}
                placeholder="Add any internal notes about this client..."
                style={{ resize: 'vertical', lineHeight: '1.6' }}
                value={form.notes || ''}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>
          </div>

        </div>
        </fieldset>
      </form>
    </div>
  );
}
