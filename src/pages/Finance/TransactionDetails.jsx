import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useFinance } from '../../context/FinanceContext';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import '../Finance/Finance.css';

const BANKS = [
  { value: 'Al Rajhi Bank', label: 'Al Rajhi Bank (مصرف الراجحي)' },
  { value: 'SNB', label: 'Saudi National Bank (البنك الأهلي)' },
  { value: 'Al Awal Bank', label: 'Al Awal Bank (البنك الأول)' },
  { value: 'Riyad Bank', label: 'Riyad Bank (بنك الرياض)' },
  { value: 'SABB', label: 'SABB (البنك السعودي البريطاني)' },
  { value: 'Alinma Bank', label: 'Alinma Bank (مصرف الإنماء)' },
  { value: 'BSF', label: 'Banque Saudi Fransi (البنك السعودي الفرنسي)' },
  { value: 'Petty Cash Safe', label: '💰 Petty Cash Safe (الصندوق النقدي)' },
  { value: 'Other', label: 'Other' },
];

export default function TransactionDetails() {
  const { id } = useParams();
  const { language, t, formatDateDual } = useLanguage();
  const navigate = useNavigate();
  const { transactions, loading, updateTransaction, deleteTransaction } = useFinance();
  const { buildings } = useProperty();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const tx = transactions.find(t => t.id && t.id.toString() === id);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tx && !form) {
      setForm({ ...tx });
    }
  }, [tx, form]);

  if (loading) {
    return (
      <div className="finance-page">
        <div className="finance-header">
          <h1 className="page-title">Loading transaction...</h1>
        </div>
      </div>
    );
  }

  if (!tx || !form) {
    return (
      <div className="finance-page">
        <div className="finance-header">
          <button className="icon-btn" onClick={() => navigate('/finance')}><ArrowLeft size={20} /></button>
          <h1 className="page-title">Transaction not found</h1>
        </div>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateTransaction(tx.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this transaction? This cannot be undone.')) {
      deleteTransaction(tx.id);
      navigate('/finance');
    }
  };

  const isIncome = form.type === 'INCOME';

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div className="header-breadcrumbs">
          <button className="icon-btn back-btn" onClick={() => navigate('/finance')}
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border-color)' }}>
            <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {form.category} — {form.entity}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {formatDateDual(form.date)} &nbsp;·&nbsp;
              <span className={isIncome ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                {isIncome ? '+' : '-'} {t('currencySAR')} {parseFloat(form.amount || 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <button type="button" className="filter-btn" onClick={handleDelete}
              style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-text)' }}>
              <Trash2 size={16} /> Delete
            </button>
          )}
          {isAdmin && (
            <button type="submit" form="tx-edit-form"
              className={`btn-primary ${saved ? 'saved-pulse' : ''}`}>
              {saved ? '✓ Saved!' : <><Save size={16} style={{ display: 'inline', marginInlineEnd: '6px' }} />Save</>}
            </button>
          )}
        </div>
      </div>

      <form id="tx-edit-form" onSubmit={handleSave}>
        <fieldset disabled={!isAdmin} style={{ border: 'none', padding: 0, margin: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Transaction Info */}
          <div className="glass-panel detail-card">
            <div className="detail-card-header">
              {isIncome ? <TrendingUp size={20} className="text-success" /> : <TrendingDown size={20} className="text-danger" />}
              <h2>{t('transactionDetails') || 'Transaction Details'}</h2>
            </div>
            <div className="detail-fields">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>{t('transactionType') || 'Type'}</label>
                  <select className="form-input" value={form.type}
                    onChange={e => setForm({...form, type: e.target.value,
                      category: e.target.value === 'INCOME' ? 'Rent Payment' : 'Maintenance'})}>
                    <option value="INCOME">Income (Revenue)</option>
                    <option value="EXPENSE">Expense (Cost)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('category') || 'Category'}</label>
                  <select className="form-input" value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}>
                    {form.type === 'INCOME' ? (
                      <>
                        <option value="Rent Payment">Rent Payment</option>
                        <option value="Service Charge">Service Charge</option>
                        <option value="Late Fee">Late Fee</option>
                        <option value="Other Revenue">Other Revenue</option>
                      </>
                    ) : (
                      <>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Utility Bill">Utility Bill</option>
                        <option value="Taxes">Taxes</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Other Expense">Other Expense</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>{t('amountSAR')}</label>
                  <input required type="number" min="0" step="0.01" className="form-input"
                    value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('date') || 'Date'}</label>
                  <input type="date" className="form-input"
                    value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
                  {form.date && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                       {formatDateDual(form.date).split(' / ')[1]} (Hijri)
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>{t('linkedProperty')}</label>
                <select className="form-input" value={form.entity}
                  onChange={e => setForm({...form, entity: e.target.value})}>
                  <option value="General Operations">{t('generalOperations')}</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('notes')}</label>
                <input type="text" className="form-input"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="glass-panel detail-card">
            <div className="detail-card-header">
              <span style={{ fontSize: '1.2rem' }}>💳</span>
              <h2>Payment Information</h2>
            </div>
            <div className="detail-fields">
              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-toggle">
                  <button type="button"
                    className={`payment-toggle-btn ${form.paymentMethod === 'Cash' ? 'active' : ''}`}
                    onClick={() => setForm({...form, paymentMethod: 'Cash'})}>
                    💵 Cash
                  </button>
                  <button type="button"
                    className={`payment-toggle-btn ${form.paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                    onClick={() => setForm({...form, paymentMethod: 'Bank Transfer'})}>
                    🏦 Bank Transfer
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{form.paymentMethod === 'Cash' ? 'Deposited To (Bank / Safe)' : 'Bank Name'}</label>
                <select className="form-input" value={form.bankName}
                  onChange={e => setForm({...form, bankName: e.target.value})}>
                  <option value="">-- Select Bank --</option>
                  {BANKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{form.paymentMethod === 'Cash' ? 'Deposit Slip / Receipt No.' : 'Transfer Reference No.'}</label>
                <input type="text" className="form-input"
                  placeholder={form.paymentMethod === 'Cash' ? 'e.g. SLIP-2024-0045' : 'e.g. TXN-2024-0012'}
                  value={form.bankReference}
                  onChange={e => setForm({...form, bankReference: e.target.value})} />
              </div>
            </div>
          </div>

        </div>
        </fieldset>
      </form>
    </div>
  );
}
