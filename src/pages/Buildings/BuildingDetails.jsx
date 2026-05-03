import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Pencil, Trash2, MoreVertical, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import '../../components/ActionMenu.css';
import './Buildings.css';

function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="action-menu-wrapper" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)}><MoreVertical size={16} /></button>
      {open && (
        <div className="action-dropdown">
          <button className="action-dropdown-item" onClick={() => { onEdit(); setOpen(false); }}><Pencil size={15} /> Edit</button>
          <button className="action-dropdown-item danger" onClick={() => { onDelete(); setOpen(false); }}><Trash2 size={15} /> Delete</button>
        </div>
      )}
    </div>
  );
}

const emptyUnit = {
  unitNumber: '', type: 'Flat', floor: '',
  // Section 9 — Rental Unit Data
  unitArea: '', furnished: false, kitchenCabinets: false, furnishingStatus: '', numberOfAC: '',
  electricityMeterNo: '', electricityMeterReading: '',
  gasMeterNo: '', gasMeterReading: '',
  waterMeterNo: '', waterMeterReading: '',
};

export default function BuildingDetails() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { buildings, loading, addUnit, updateUnit, deleteUnit } = useProperty();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const building = buildings.find(b => b.id === id);
  const units = building?.units || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState(emptyUnit);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = useMemo(() => {
    return units.filter(u => {
      const matchSearch = u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.client && u.client.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = !filterStatus || u.status === filterStatus;
      const matchType = !filterType || u.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [units, searchTerm, filterStatus, filterType]);

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const openAdd = () => { setEditingUnit(null); setFormData(emptyUnit); setIsModalOpen(true); };
  const openEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitNumber: unit.unitNumber || '', type: unit.type || 'Flat', floor: unit.floor || '',
      unitArea: unit.unitArea || '', furnished: unit.furnished || false,
      kitchenCabinets: unit.kitchenCabinets || false, furnishingStatus: unit.furnishingStatus || '',
      numberOfAC: unit.numberOfAC ?? '',
      electricityMeterNo: unit.electricityMeterNo || '', electricityMeterReading: unit.electricityMeterReading || '',
      gasMeterNo: unit.gasMeterNo || '', gasMeterReading: unit.gasMeterReading || '',
      waterMeterNo: unit.waterMeterNo || '', waterMeterReading: unit.waterMeterReading || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (unitId) => { if (window.confirm('Delete this unit?')) deleteUnit(building.id, unitId); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const savePayload = {
      unitNumber: formData.unitNumber,
      type: formData.type,
      ...(formData.type === 'Flat' && { floor: parseInt(formData.floor) || formData.floor }),
      unitArea: formData.unitArea ? parseFloat(formData.unitArea) : null,
      furnished: formData.furnished,
      kitchenCabinets: formData.kitchenCabinets,
      furnishingStatus: formData.furnishingStatus,
      numberOfAC: formData.numberOfAC !== '' ? parseInt(formData.numberOfAC) : null,
      electricityMeterNo: formData.electricityMeterNo,
      electricityMeterReading: formData.electricityMeterReading,
      gasMeterNo: formData.gasMeterNo,
      gasMeterReading: formData.gasMeterReading,
      waterMeterNo: formData.waterMeterNo,
      waterMeterReading: formData.waterMeterReading,
    };
    if (editingUnit) updateUnit(building.id, editingUnit.id, savePayload);
    else addUnit(building.id, savePayload);
    setIsModalOpen(false);
  };

  if (loading) return <div className="buildings-page"><div className="page-header"><h1 className="page-title">Loading...</h1></div></div>;
  if (!building) return (
    <div className="buildings-page"><div className="page-header">
      <button className="icon-btn back-btn" onClick={() => navigate('/buildings')}><ArrowLeft size={20} /></button>
      <h1 className="page-title">Building not found</h1>
    </div></div>
  );

  return (
    <div className="buildings-page">
      <div className="page-header">
        <div className="header-breadcrumbs">
          <button className="icon-btn back-btn" onClick={() => navigate('/buildings')}>
            <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
          <div>
            <h1 className="page-title">{building.name}</h1>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '2px' }}>{building.location}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>{t('addUnit')}</button>
      </div>

      {/* Building owner info strip */}
      {building.ownerName && (
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
          <div><span className="text-secondary">👤 المؤجر:</span> <strong>{building.ownerName}</strong></div>
          {building.ownerIdNo && <div><span className="text-secondary">رقم الهوية:</span> {building.ownerIdNo}</div>}
          {building.ownerMobile && <div><span className="text-secondary">الجوال:</span> {building.ownerMobile}</div>}
          {building.titleDeedNo && <div><span className="text-secondary">📜 رقم الصك:</span> {building.titleDeedNo}</div>}
          {building.propertyType && <div><span className="text-secondary">نوع العقار:</span> {building.propertyType}</div>}
          {building.propertyUsage && <div><span className="text-secondary">الاستخدام:</span> {building.propertyUsage}</div>}
        </div>
      )}

      <div className="glass-panel main-panel">
        <div className="panel-toolbar">
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder={`${t('search')} ${t('units')}...`} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
          <button className={`filter-btn ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter(!showFilter)}>
            {showFilter ? <X size={18} /> : <Filter size={18} />}<span>{t('filter')}</span>
          </button>
        </div>

        {showFilter && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>{t('status')}</label>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="Available">{t('available')}</option>
                <option value="Leased">{t('leased')}</option>
              </select>
            </div>
            <div className="filter-group">
              <label>{t('unitType')}</label>
              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Flat">{t('flat')}</option>
                <option value="Shop">{t('shop')}</option>
                <option value="Office">{t('office')}</option>
              </select>
            </div>
            <button className="filter-reset-btn" onClick={() => { setFilterStatus(''); setFilterType(''); }}>Reset</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t('unitNumber')}</th>
                <th>{t('unitType')}</th>
                <th>{t('floor')}</th>
                <th>مساحة / Area (m²)</th>
                <th>التكييف / AC</th>
                <th>{t('status')}</th>
                <th>{t('currentClient')}</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr key={unit.id} className="clickable-row" onClick={() => openEdit(unit)}>
                  <td className="font-medium">{unit.unitNumber}</td>
                  <td className="text-secondary">{t(unit.type) || unit.type}</td>
                  <td className="font-mono">{unit.type === 'Flat' ? unit.floor : '—'}</td>
                  <td className="text-secondary">{unit.unitArea ? `${unit.unitArea} m²` : '—'}</td>
                  <td className="text-secondary">{unit.numberOfAC != null ? unit.numberOfAC : '—'}</td>
                  <td>
                    <span className={`status-badge ${unit.status === 'Leased' ? 'active' : 'expired'}`}>
                      {unit.status === 'Leased' ? t('leased') : t('available')}
                    </span>
                  </td>
                  <td className="font-medium text-secondary">{unit.client || <span style={{ opacity: 0.4 }}>—</span>}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {unit.status === 'Available' && (
                      <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/contracts?buildingId=${building.id}&unitId=${unit.id}`); }}>
                        {t('assignContract')}
                      </button>
                    )}
                    {unit.status === 'Leased' && <ChevronRight size={16} className="text-secondary" style={{ opacity: 0.5 }} />}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center empty-state">{t('noUnitsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUnit ? 'Edit Unit / تعديل الوحدة' : t('registerNewUnit')}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <fieldset disabled={!isAdmin && !!editingUnit} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ─── Basic Unit Info ─── */}
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🚪 بيانات الوحدة — Unit Info
            </div>
            <div className="form-group">
              <label>{t('unitNumber')} ({t(formData.type) || formData.type})</label>
              <input required type="text" className="form-input" placeholder="e.g. شقة السطح / 101"
                value={formData.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>{t('classificationType')}</label>
                <select className="form-input" value={formData.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="Flat">Flat — شقة</option>
                  <option value="Shop">Shop — محل</option>
                  <option value="Office">Office — مكتب</option>
                  <option value="Villa">Villa — فيلا</option>
                  <option value="Warehouse">Warehouse — مستودع</option>
                </select>
              </div>
              {formData.type === 'Flat' && (
                <div className="form-group">
                  <label>رقم الطابق / Floor No.</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 2"
                    value={formData.floor} onChange={(e) => set('floor', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label>مساحة الوحدة / Unit Area (م²)</label>
                <input type="number" min="0" step="0.1" className="form-input" placeholder="e.g. 120.0"
                  value={formData.unitArea} onChange={(e) => set('unitArea', e.target.value)} />
              </div>
            </div>

            {/* ─── Section 9: Furnishing ─── */}
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🛋️ التأثيث — Furnishing (Section 9)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <input type="checkbox" checked={formData.furnished} onChange={(e) => set('furnished', e.target.checked)}
                  style={{ accentColor: 'var(--primary-color)' }} />
                <span style={{ fontSize: '0.85rem' }}>مؤثثة — Furnished</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <input type="checkbox" checked={formData.kitchenCabinets} onChange={(e) => set('kitchenCabinets', e.target.checked)}
                  style={{ accentColor: 'var(--primary-color)' }} />
                <span style={{ fontSize: '0.85rem' }}>خزائن مطبخ مركبة — Kitchen Cabinets</span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>حالة التأثيث / Furnishing Status</label>
                <input type="text" className="form-input" placeholder="e.g. مؤثث جزئياً"
                  value={formData.furnishingStatus} onChange={(e) => set('furnishingStatus', e.target.value)} />
              </div>
              <div className="form-group">
                <label>عدد وحدات التكييف / AC Units</label>
                <input type="number" min="0" className="form-input" placeholder="e.g. 1"
                  value={formData.numberOfAC} onChange={(e) => set('numberOfAC', e.target.value)} />
              </div>
            </div>

            {/* ─── Section 9: Meters ─── */}
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              ⚡ العدادات — Utility Meters (Section 9)
            </div>
            {[
              { label: '⚡ الكهرباء / Electricity', noField: 'electricityMeterNo', readField: 'electricityMeterReading', noPlaceholder: 'Meter No.', readPlaceholder: 'Current Reading' },
              { label: '🔥 الغاز / Gas', noField: 'gasMeterNo', readField: 'gasMeterReading', noPlaceholder: 'Meter No.', readPlaceholder: 'Current Reading' },
              { label: '💧 المياه / Water', noField: 'waterMeterNo', readField: 'waterMeterReading', noPlaceholder: 'Meter No.', readPlaceholder: 'Current Reading' },
            ].map(({ label, noField, readField, noPlaceholder, readPlaceholder }) => (
              <div key={noField} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>{label} — رقم العداد</label>
                  <input type="text" className="form-input" placeholder={noPlaceholder}
                    value={formData[noField]} onChange={(e) => set(noField, e.target.value)} />
                </div>
                <div className="form-group">
                  <label>القراءة الحالية / Current Reading</label>
                  <input type="number" step="0.01" className="form-input" placeholder={readPlaceholder}
                    value={formData[readField]} onChange={(e) => set(readField, e.target.value)} />
                </div>
              </div>
            ))}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
              {(!editingUnit || isAdmin) && (
                <button type="submit" className="btn-primary">{editingUnit ? 'Update Unit' : t('saveUnit')}</button>
              )}
              {editingUnit && isAdmin && (
                <button type="button" className="btn-secondary" style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-text)' }}
                  onClick={() => { handleDelete(editingUnit.id); setIsModalOpen(false); }}>
                  <Trash2 size={16} style={{ display: 'inline', marginInlineEnd: '4px' }} /> Delete
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
