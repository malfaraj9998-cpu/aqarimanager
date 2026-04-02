import React, { useRef, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, CheckCircle, AlertCircle, Building2, Percent, Download, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useContract } from '../../context/ContractContext';
import { useFinance } from '../../context/FinanceContext';
import { useClient } from '../../context/ClientContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Dashboard.css';

export default function Dashboard() {
  const { t, language, formatDateDual } = useLanguage();
  const { buildings, totalUnitsCount, leasedUnitsCount, occupancyRate } = useProperty();
  const { activeContracts, contracts } = useContract();
  const { transactions } = useFinance();
  const { clients } = useClient();
  const reportRef = useRef();

  // Contracts expiring within 60 days
  const expiringSoon = useMemo(() => {
    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    return activeContracts.filter(c => {
      const end = new Date(c.endDate);
      return end >= now && end <= in60;
    }).length;
  }, [activeContracts]);

  // Selected tracking year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Analytics logic
  const revenueChartData = useMemo(() => {
    const months = [];
    const isPastYear = selectedYear < new Date().getFullYear();
    const cycleCount = isPastYear ? 12 : 6;
    
    for (let i = cycleCount - 1; i >= 0; i--) {
      // In past year, show all 12 months. In current year, show last 6.
      const d = new Date(selectedYear, isPastYear ? i : new Date().getMonth() - i, 1);
      const monthNum = d.getMonth() + 1;
      const key = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      const label = d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
      const income = transactions
        .filter(tx => tx.type === 'INCOME' && tx.date?.startsWith(key))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const expense = transactions
        .filter(tx => tx.type === 'EXPENSE' && tx.date?.startsWith(key))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      months.push({ name: label, income, expense });
    }
    return months;
  }, [transactions, language, selectedYear]);

  const yearlyIncome = useMemo(() =>
    transactions
      .filter(tx => tx.type === 'INCOME' && tx.date?.startsWith(String(selectedYear)))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0),
  [transactions, selectedYear]);

  // Recent activity: last 4 contracts sorted by createdAt
  const recentContracts = useMemo(() =>
    [...contracts]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 4),
  [contracts]);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || t('unknownClient');
  };

  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : '—';
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ${t('dayAgo')}`;
    if (hours > 0) return `${hours}h ${t('hoursAgo')}`;
    return `< 1h`;
  };

  const handleExportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    const btn = document.getElementById('export-pdf-btn');
    const primaryBtn = document.getElementById('generate-report-btn');
    
    if (btn) btn.disabled = true;
    if (primaryBtn) {
      primaryBtn.disabled = true;
      primaryBtn.innerText = '...';
    }

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(language === 'ar' ? 'عقاري - تقرير تحليلي' : 'Aqari Manager — Analytics Report', 10, 12);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-SA')}`, pageWidth - 10, 12, { align: 'right' });
      const startY = 22;
      if (imgHeight + startY <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 10, startY, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight, yOffset = 0, page = 0;
        const usableHeight = pageHeight - startY - 10;
        while (remainingHeight > 0) {
          if (page > 0) pdf.addPage();
          const sliceHeight = Math.min(remainingHeight, usableHeight);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = (sliceHeight / imgWidth) * canvas.width;
          const sliceCtx = sliceCanvas.getContext('2d');
          sliceCtx.drawImage(canvas, 0, yOffset * (canvas.height / imgHeight), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, page === 0 ? startY : 10, imgWidth, sliceHeight);
          yOffset += sliceHeight;
          remainingHeight -= sliceHeight;
          page++;
        }
      }
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Page ${i} of ${totalPages} — Aqari Manager`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      pdf.save(`aqari-dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      alert('✅ Report generated successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('❌ Failed to generate PDF report. Please try again.');
    } finally {
      if (btn) btn.disabled = false;
      if (primaryBtn) {
        primaryBtn.disabled = false;
        primaryBtn.innerText = t('generateReport');
      }
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ marginBottom: '0' }}>
        <div ref={reportRef} style={{ flex: 1 }}>
          <div className="welcome-banner glass-panel">
            <div>
              <h1 className="welcome-title">{t('welcome')}, {t('admin')}</h1>
              <p className="welcome-subtitle">{t('dashboardSubtitle')}</p>
            </div>
          </div>

          <div className="quick-stats-grid" style={{ marginTop: '1.5rem' }}>
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper"><Building2 size={24} className="text-primary" /></div>
              <div className="stat-content">
                <h3 className="stat-title">{t('totalBuildings')}</h3>
                <div className="kpi-value">{t('currencySAR')} {yearlyIncome.toLocaleString()}</div>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper"><Percent size={24} className="text-success" /></div>
              <div className="stat-content">
                <h3 className="stat-title">{t('occupancyRate')}</h3>
                <p className="stat-value">{occupancyRate}%</p>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper"><Users size={24} className="text-primary" /></div>
              <div className="stat-content">
                <h3 className="stat-title">{t('totalTenants')}</h3>
                <p className="stat-value">{leasedUnitsCount}</p>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper"><AlertCircle size={24} className="text-warning" /></div>
              <div className="stat-content">
                <h3 className="stat-title">{t('expiringSoon')}</h3>
                <p className="stat-value">{expiringSoon}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
            {/* Revenue Chart */}
            <div className="glass-panel dashboard-card col-span-2">
              <div className="card-header">
                <h2 className="card-title">{t('revenueGrowth')}</h2>
                <span className="badge positive">
                  <TrendingUp size={13} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                  {t('currencySAR')} {yearlyIncome.toLocaleString()} · {selectedYear}
                </span>
              </div>
              {transactions.length === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-secondary" style={{ fontSize: '0.875rem' }}>No financial records yet.</p>
                </div>
              ) : (
                <div className="mini-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success-text)" stopOpacity={0.7}/>
                          <stop offset="95%" stopColor="var(--success-text)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--danger-text)" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="var(--danger-text)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                      <Area type="monotone" dataKey="income" stroke="var(--success-text)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name={t('totalIncome')} isAnimationActive={false} />
                      <Area type="monotone" dataKey="expense" stroke="var(--danger-text)" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name={t('totalExpenses')} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="glass-panel dashboard-card">
              <div className="card-header">
                <h2 className="card-title">{t('recentActivity')}</h2>
              </div>
              <div className="activity-list">
                {recentContracts.length === 0 ? (
                  <p className="text-secondary" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>
                    {t('noActiveContractsFound')}
                  </p>
                ) : (
                  recentContracts.map(contract => (
                    <div key={contract.id} className="activity-item">
                      <div className={`activity-icon ${contract.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                        {contract.status === 'Active'
                          ? <CheckCircle size={16} className="text-success" />
                          : <FileText size={16} className="text-warning" />}
                      </div>
                      <div className="activity-details">
                        <p className="activity-text">
                          {t('contractExpiringFor')} <strong>{contract.clientName || t('unknownClient')}</strong>
                        </p>
                        <span className="activity-time">#{contract.contractNumber} · {getBuildingName(contract.buildingId)} · {formatDateDual(contract.endDate)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <div className="year-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('selectYear')}</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
          >
            {[2021, 2022, 2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button id="generate-report-btn" className="btn-primary" onClick={handleExportPDF}>{t('generateReport')}</button>
      </div>
    </div>
  );
}
