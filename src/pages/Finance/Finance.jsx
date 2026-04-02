import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Filter, Search, Download, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useFinance } from '../../context/FinanceContext';
import { useProperty } from '../../context/PropertyContext';
import Modal from '../../components/Modal';
import { exportToExcel } from '../../utils/exportToExcel';
import './Finance.css';

const sparklineData = [];  // replaced by computed data below

export default function Finance() {
  const { t, language, formatDateDual } = useLanguage();
  const navigate = useNavigate();
  const { transactions, addTransaction } = useFinance();
  const { buildings } = useProperty();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    type: 'INCOME', category: 'Rent Payment', amount: '', date: '',
    description: '', entity: 'General Operations',
    paymentMethod: 'Bank Transfer', bankName: '', bankReference: ''
  });

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const netProfit = totalIncome - totalExpenses;

  // Real monthly cashflow for last 7 months
  const monthlyChartData = useMemo(() => {
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
      const income = transactions.filter(tx => tx.type === 'INCOME' && tx.date?.startsWith(key)).reduce((s, tx) => s + (tx.amount || 0), 0);
      const expense = transactions.filter(tx => tx.type === 'EXPENSE' && tx.date?.startsWith(key)).reduce((s, tx) => s + (tx.amount || 0), 0);
      months.push({ name: label, income, expense });
    }
    return months;
  }, [transactions, language]);

  // Month-over-month comparison helpers
  const getMonthKey = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const thisMonthKey = getMonthKey(0);
  const lastMonthKey = getMonthKey(1);

  const thisMonthIncome = useMemo(() => transactions.filter(tx => tx.type === 'INCOME' && tx.date?.startsWith(thisMonthKey)).reduce((s, tx) => s + (tx.amount || 0), 0), [transactions, thisMonthKey]);
  const lastMonthIncome = useMemo(() => transactions.filter(tx => tx.type === 'INCOME' && tx.date?.startsWith(lastMonthKey)).reduce((s, tx) => s + (tx.amount || 0), 0), [transactions, lastMonthKey]);
  const thisMonthExpense = useMemo(() => transactions.filter(tx => tx.type === 'EXPENSE' && tx.date?.startsWith(thisMonthKey)).reduce((s, tx) => s + (tx.amount || 0), 0), [transactions, thisMonthKey]);
  const lastMonthExpense = useMemo(() => transactions.filter(tx => tx.type === 'EXPENSE' && tx.date?.startsWith(lastMonthKey)).reduce((s, tx) => s + (tx.amount || 0), 0), [transactions, lastMonthKey]);

  const calcTrend = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { pct: 100, dir: 'up' };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { pct: Math.abs(pct), dir: pct >= 0 ? 'up' : 'down' };
  };

  const incomeTrend = calcTrend(thisMonthIncome, lastMonthIncome);
  const expenseTrend = calcTrend(thisMonthExpense, lastMonthExpense);
  const netThis = thisMonthIncome - thisMonthExpense;
  const netLast = lastMonthIncome - lastMonthExpense;
  const netTrend = calcTrend(netThis, netLast);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.entity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = !filterType || tx.type === filterType;
      const matchCat = !filterCategory || tx.category === filterCategory;
      const matchEntity = !filterEntity || tx.entity === filterEntity;
      return matchSearch && matchType && matchCat && matchEntity;
    });
  }, [transactions, searchTerm, filterType, filterCategory, filterEntity]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addTransaction(newTx);
    setIsModalOpen(false);
    setNewTx({ type: 'INCOME', category: 'Rent Payment', amount: '', date: '', description: '', entity: 'General Operations', paymentMethod: 'Bank Transfer', bankName: '', bankReference: '' });
  };

  const handleExport = () => {
    const data = transactions.map(tx => ({
      'Date': tx.date, 'Type': tx.type, 'Category': tx.category,
      'Property': tx.entity, 'Description': tx.description,
      'Payment Method': tx.paymentMethod || '',
      'Bank Name': tx.bankName || '',
      'Bank Reference': tx.bankReference || '',
      [t('amountSAR')]: tx.amount,
    }));
    exportToExcel(data, 'Ledger', 'aqari-finance-ledger');
  };

  const getTranslatedCategory = (cat) => {
    const map = { 'Rent Payment': 'rentPayment', 'Service Charge': 'serviceCharge', 'Late Fee': 'lateFee', 'Other Revenue': 'otherRevenue', 'Maintenance': 'maintenance', 'Utility Bill': 'utilityBill', 'Taxes': 'taxes', 'Payroll': 'payroll', 'Other Expense': 'otherExpense' };
    return map[cat] ? t(map[cat]) : cat;
  };

  return (
    <div className="finance-page">
      <div className="finance-header">
        <h1 className="page-title">{t('financeLedger')}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="filter-btn" onClick={handleExport}><Download size={18} /><span>{t('Export Excel')}</span></button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('recordTransaction')}</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-header"><span className="kpi-title">{t('totalIncome')}</span><div className="icon-wrapper bg-success"><TrendingUp size={20} className="text-success" /></div></div>
          <div className="kpi-value">{t('currencySAR')} {totalIncome.toLocaleString()}</div>
          {incomeTrend ? (
            <div className={`kpi-trend ${incomeTrend.dir === 'up' ? 'positive' : 'negative'}`}>
              {incomeTrend.dir === 'up' ? '+' : '-'}{incomeTrend.pct}% {t('fromLastMonth')}
            </div>
          ) : <div className="kpi-trend" style={{ opacity: 0.4 }}>— {t('fromLastMonth')}</div>}
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-header"><span className="kpi-title">{t('totalExpenses')}</span><div className="icon-wrapper bg-danger"><TrendingDown size={20} className="text-danger" /></div></div>
          <div className="kpi-value">{t('currencySAR')} {totalExpenses.toLocaleString()}</div>
          {expenseTrend ? (
            <div className={`kpi-trend ${expenseTrend.dir === 'up' ? 'negative' : 'positive'}`}>
              {expenseTrend.dir === 'up' ? '+' : '-'}{expenseTrend.pct}% {t('fromLastMonth')}
            </div>
          ) : <div className="kpi-trend" style={{ opacity: 0.4 }}>— {t('fromLastMonth')}</div>}
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-header"><span className="kpi-title">{t('netProfit')}</span><div className="icon-wrapper bg-primary"><DollarSign size={20} className="text-primary" /></div></div>
          <div className="kpi-value">{t('currencySAR')} {netProfit.toLocaleString()}</div>
          {netTrend ? (
            <div className={`kpi-trend ${netTrend.dir === 'up' ? 'positive' : 'negative'}`}>
              {netTrend.dir === 'up' ? '+' : '-'}{netTrend.pct}% {t('fromLastMonth')}
            </div>
          ) : <div className="kpi-trend" style={{ opacity: 0.4 }}>— {t('fromLastMonth')}</div>}
        </div>
      </div>

      <div className="glass-panel chart-container">
        <h2 className="section-title">{t('cashflowOverview')}</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success-text)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--success-text)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger-text)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--danger-text)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="income" stroke="var(--success-text)" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="var(--danger-text)" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel main-panel">
        <div className="panel-toolbar">
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder={t('searchTransactions')} value={searchTerm}
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
              <label>Type</label>
              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All</option>
                <option value="INCOME">{t('incomeRev')}</option>
                <option value="EXPENSE">{t('expenseCost')}</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Category</label>
              <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All</option>
                <option value="Rent Payment">{t('rentPayment')}</option>
                <option value="Maintenance">{t('maintenance')}</option>
                <option value="Utility Bill">{t('utilityBill')}</option>
                <option value="Taxes">{t('taxes')}</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Property</label>
              <select className="filter-select" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}>
                <option value="">{t('all') || 'All'}</option>
                <option value="General Operations">{t('generalOperations')}</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <button className="filter-reset-btn" onClick={() => { setFilterType(''); setFilterCategory(''); setFilterEntity(''); }}>Reset</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('transactionType')}</th>
                <th>{t('propertyEntity')}</th>
                <th>Payment</th>
                <th>{t('description')}</th>
                <th style={{ textAlign: 'end' }}>{t('amountSAR')}</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className="clickable-row" onClick={() => navigate(`/finance/${tx.id}`)}>
                  <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>{formatDateDual(tx.date)}</td>
                  <td>
                    <span className={`type-badge ${tx.type === 'INCOME' ? 'bg-success text-success' : 'bg-danger text-danger'}`}>
                      {tx.type === 'INCOME' ? t('incomeRev') : t('expenseCost')}
                    </span>
                    <span className="text-xs text-secondary" style={{ marginInlineStart: '8px' }}>{getTranslatedCategory(tx.category)}</span>
                  </td>
                  <td className="font-medium">{tx.entity === 'General Operations' ? t('generalOperations') : tx.entity}</td>
                  <td>
                    <span className={`payment-badge ${tx.paymentMethod === 'Cash' ? 'cash' : 'transfer'}`}>
                      {tx.paymentMethod === 'Cash' ? '💵 Cash' : '🏦 Transfer'}
                    </span>
                    {tx.bankName && (
                      <div className="text-xs text-secondary" style={{ marginTop: '3px' }}>
                        {tx.bankName}{tx.bankReference ? ` · ${tx.bankReference}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="text-secondary">{tx.description}</td>
                  <td style={{ textAlign: 'end', fontWeight: '600' }} className={tx.type === 'INCOME' ? 'text-success' : 'text-danger'}>
                    {tx.type === 'INCOME' ? '+' : '-'} {tx.amount.toLocaleString()}
                  </td>
                  <td><ChevronRight size={16} className="text-secondary" style={{ opacity: 0.5 }} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center empty-state">{t('noTransactionsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('recordTransaction')}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('transactionType')}</label>
              <select className="form-input" value={newTx.type}
                onChange={(e) => setNewTx({...newTx, type: e.target.value, category: e.target.value === 'INCOME' ? 'Rent Payment' : 'Maintenance'})}>
                <option value="INCOME">{t('incomeRev')}</option>
                <option value="EXPENSE">{t('expenseCost')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('category')}</label>
              <select className="form-input" value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value})}>
                {newTx.type === 'INCOME' ? (
                  <><option value="Rent Payment">{t('rentPayment')}</option><option value="Service Charge">{t('serviceCharge')}</option><option value="Late Fee">{t('lateFee')}</option><option value="Other Revenue">{t('otherRevenue')}</option></>
                ) : (
                  <><option value="Maintenance">{t('maintenance')}</option><option value="Utility Bill">{t('utilityBill')}</option><option value="Taxes">{t('taxes')}</option><option value="Payroll">{t('payroll')}</option><option value="Other Expense">{t('otherExpense')}</option></>
                )}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('amountSAR')}</label>
              <input required type="number" min="0" step="0.01" className="form-input" placeholder="e.g. 5000"
                value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('date')}</label>
              <input required type="date" className="form-input"
                value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} />
              {newTx.date && (
                <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                   {formatDateDual(newTx.date).split(' / ')[1]} (Hijri)
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>{t('linkedProperty')}</label>
            <select className="form-input" value={newTx.entity} onChange={(e) => setNewTx({...newTx, entity: e.target.value})}>
              <option value="General Operations">{t('generalOperations')}</option>
              {buildings.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('notes')}</label>
            <input type="text" className="form-input" placeholder="e.g. Fixing AC unit in lobby"
              value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} />
          </div>
          <div className="payment-method-section">
            <div className="form-group">
              <label>Payment Method</label>
              <div className="payment-toggle">
                <button type="button" className={`payment-toggle-btn ${newTx.paymentMethod === 'Cash' ? 'active' : ''}`}
                  onClick={() => setNewTx({...newTx, paymentMethod: 'Cash'})}>💵 Cash</button>
                <button type="button" className={`payment-toggle-btn ${newTx.paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                  onClick={() => setNewTx({...newTx, paymentMethod: 'Bank Transfer'})}>🏦 Bank Transfer</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>{newTx.paymentMethod === 'Cash' ? 'Deposited To (Bank / Safe)' : 'Bank Name'}</label>
                <select className="form-input" value={newTx.bankName} onChange={(e) => setNewTx({...newTx, bankName: e.target.value})}>
                  <option value="">-- Select Bank --</option>
                  <option value="Al Rajhi Bank">Al Rajhi Bank (مصرف الراجحي)</option>
                  <option value="SNB">Saudi National Bank (البنك الأهلي)</option>
                  <option value="Al Awal Bank">Al Awal Bank (البنك الأول)</option>
                  <option value="Riyad Bank">Riyad Bank (بنك الرياض)</option>
                  <option value="SABB">SABB (البنك السعودي البريطاني)</option>
                  <option value="Alinma Bank">Alinma Bank (مصرف الإنماء)</option>
                  <option value="BSF">Banque Saudi Fransi (البنك السعودي الفرنسي)</option>
                  <option value="Petty Cash Safe">💰 Petty Cash Safe (الصندوق النقدي)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>{newTx.paymentMethod === 'Cash' ? 'Deposit Slip / Receipt No.' : 'Transfer Reference No.'}</label>
                <input type="text" className="form-input"
                  placeholder={newTx.paymentMethod === 'Cash' ? 'e.g. SLIP-2024-0045' : 'e.g. TXN-2024-0012'}
                  value={newTx.bankReference} onChange={(e) => setNewTx({...newTx, bankReference: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="modal-actions" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
            <button type="submit" className="btn-primary">{t('saveTransaction')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
