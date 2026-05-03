import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import './Buildings.css';

const SectionHeader = ({ icon, title, subtitle, expanded, onToggle }) => (
  <button type="button" onClick={onToggle}
    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px',
      border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'start' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</div>}
      </div>
    </div>
    {expanded ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
  </button>
);

export default function BuildingsList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { buildings, addBuilding, deleteBuilding } = useProperty();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ basic: true, owner: false, deed: false, property: false });

  const emptyBuilding = {
    // Basic
    name: '', location: '', type: 'Residential', flatsCount: '', shopsCount: '', officesCount: '',
    // Section 2 — Lessor / Owner (بيانات المؤجر)
    ownerName: '', ownerNationality: 'المملكة العربية السعودية', ownerIdType: 'هوية وطنية',
    ownerIdNo: '', ownerMobile: '', ownerEmail: '', ownerNationalAddress: '', ownerSelfRepresented: true,
    // Section 7 — Ownership Document (بيانات مستندات الملكية)
    titleDeedNo: '', titleDeedIssuer: 'MOJ', titleDeedIssueDate: '', titleDeedIssuedFrom: '',
    // Section 8 — Property Details (بيانات العقار)
    propertyType: '', propertyUsage: '', numberOfFloors: '', numberOfParkingLots: '', numberOfElevators: '',
    nationalAddress: '',
  };

  const [newBuilding, setNewBuilding] = useState(emptyBuilding);
  const toggle = (s) => setOpenSections(p => ({ ...p, [s]: !p[s] }));
  const set = (field, val) => setNewBuilding(p => ({ ...p, [field]: val }));

  const handleAddBuilding = (e) => {
    e.preventDefault();
    if (!newBuilding.name || !newBuilding.location) return;
    addBuilding(newBuilding);
    setIsModalOpen(false);
    setNewBuilding(emptyBuilding);
    setOpenSections({ basic: true, owner: false, deed: false, property: false });
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
            <div key={building.id} className="glass-panel building-card"
              onClick={() => navigate(`/buildings/${building.id}`)} role="button">
              <div className="building-card-header">
                <div className="building-icon"><Building2 size={24} className="text-primary" /></div>
                {isAdmin && (
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this building?')) deleteBuilding(building.id); }}>
                    <Trash2 size={16} className="text-danger" />
                  </button>
                )}
              </div>
              <div className="building-info">
                <h3 className="building-name">{building.name}</h3>
                <p className="building-location"><MapPin size={14} />{building.location}</p>
                {building.ownerName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    👤 {building.ownerName}
                  </div>
                )}
                {building.titleDeedNo && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    📜 صك: {building.titleDeedNo}
                  </div>
                )}
                <span className="building-type">{t(building.type) || building.type}</span>
              </div>
              <div className="building-stats">
                <div className="stat-row">
                  <span className="stat-label">{t('occupancy')}</span>
                  <span className="stat-value">{occupancyRate}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className={`progress-bar-fill ${occupancyRate > 90 ? 'bg-success' : occupancyRate > 50 ? 'bg-primary' : 'bg-warning'}`}
                    style={{ width: `${Math.max(occupancyRate, 2)}%` }} />
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
            <div style={{ marginBottom: '1.5rem', opacity: 0.3 }}><Building2 size={64} /></div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{t('noBuildingsFound')}</h3>
            <p className="text-secondary">{t('dashboardSubtitle')}</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '2rem' }}>{t('addBuilding')}</button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setNewBuilding(emptyBuilding); }} title={t('addBuilding')}>
        <form onSubmit={handleAddBuilding} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* ─── Section: Basic Info ─── */}
          <SectionHeader icon="🏢" title="Basic Building Info" subtitle="Name, location & unit counts" expanded={openSections.basic} onToggle={() => toggle('basic')} />
          {openSections.basic && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div className="form-group">
                <label>{t('buildingName')}</label>
                <input required type="text" className="form-input" placeholder="e.g. Al Olaya Tower"
                  value={newBuilding.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>العنوان / Address</label>
                <input required type="text" className="form-input" placeholder="e.g. King Fahd Branch Rd, Riyadh"
                  value={newBuilding.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('buildingType')}</label>
                <select className="form-input" value={newBuilding.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="Residential">Residential — سكني</option>
                  <option value="Commercial">Commercial — تجاري</option>
                  <option value="Office">Office — مكاتب</option>
                  <option value="Mixed Use">Mixed Use — متعدد الاستخدام</option>
                </select>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-generate units (optional):</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group"><label style={{ fontSize: '0.8rem' }}>Flats / شقق</label>
                    <input type="number" min="0" className="form-input" value={newBuilding.flatsCount} onChange={(e) => set('flatsCount', e.target.value)} /></div>
                  <div className="form-group"><label style={{ fontSize: '0.8rem' }}>Shops / محلات</label>
                    <input type="number" min="0" className="form-input" value={newBuilding.shopsCount} onChange={(e) => set('shopsCount', e.target.value)} /></div>
                  <div className="form-group"><label style={{ fontSize: '0.8rem' }}>Offices / مكاتب</label>
                    <input type="number" min="0" className="form-input" value={newBuilding.officesCount} onChange={(e) => set('officesCount', e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Section 2: Lessor / Owner (بيانات المؤجر) ─── */}
          <SectionHeader icon="👤" title="بيانات المؤجِّر — Lessor / Owner Info" subtitle="Section 2 of Ejar Contract" expanded={openSections.owner} onToggle={() => toggle('owner')} />
          {openSections.owner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div className="form-group">
                <label>اسم المؤجر / Owner Name</label>
                <input type="text" className="form-input" placeholder="e.g. خالد عوض بن ملفي العنزي"
                  value={newBuilding.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>الجنسية / Nationality</label>
                  <input type="text" className="form-input" placeholder="المملكة العربية السعودية"
                    value={newBuilding.ownerNationality} onChange={(e) => set('ownerNationality', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>نوع الهوية / ID Type</label>
                  <select className="form-input" value={newBuilding.ownerIdType} onChange={(e) => set('ownerIdType', e.target.value)}>
                    <option value="هوية وطنية">هوية وطنية — National ID</option>
                    <option value="إقامة">إقامة — Residency</option>
                    <option value="جواز سفر">جواز سفر — Passport</option>
                    <option value="سجل تجاري">سجل تجاري — CR</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>رقم الهوية / ID No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 1110902218"
                    value={newBuilding.ownerIdNo} onChange={(e) => set('ownerIdNo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>رقم الجوال / Mobile</label>
                  <input type="tel" className="form-input" placeholder="+9665xxxxxxxx"
                    value={newBuilding.ownerMobile} onChange={(e) => set('ownerMobile', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>البريد الإلكتروني / Email</label>
                  <input type="email" className="form-input" placeholder="owner@email.com"
                    value={newBuilding.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>العنوان الوطني / National Address</label>
                  <input type="text" className="form-input" placeholder="e.g. الرياض, الرياض"
                    value={newBuilding.ownerNationalAddress} onChange={(e) => set('ownerNationalAddress', e.target.value)} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.65rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <input type="checkbox" checked={newBuilding.ownerSelfRepresented}
                  onChange={(e) => set('ownerSelfRepresented', e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)' }} />
                <span style={{ fontSize: '0.85rem' }}>المؤجر ممثل بنفسه — Owner self-represented</span>
              </label>
            </div>
          )}

          {/* ─── Section 7: Ownership Document (بيانات مستندات الملكية) ─── */}
          <SectionHeader icon="📜" title="بيانات مستندات الملكية — Ownership Document" subtitle="Section 7 — Title Deed (الصك)" expanded={openSections.deed} onToggle={() => toggle('deed')} />
          {openSections.deed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>رقم المستند / Title Deed No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 360001272142"
                    value={newBuilding.titleDeedNo} onChange={(e) => set('titleDeedNo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>جهة الإصدار / Issuer</label>
                  <select className="form-input" value={newBuilding.titleDeedIssuer} onChange={(e) => set('titleDeedIssuer', e.target.value)}>
                    <option value="MOJ">MOJ — وزارة العدل</option>
                    <option value="Municipality">Municipality — البلدية</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>تاريخ الإصدار / Issue Date (Hijri)</label>
                  <input type="text" className="form-input" placeholder="e.g. 1445-08-04"
                    value={newBuilding.titleDeedIssueDate} onChange={(e) => set('titleDeedIssueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>مكان الإصدار / Place of Issue</label>
                  <input type="text" className="form-input" placeholder="e.g. الرياض"
                    value={newBuilding.titleDeedIssuedFrom} onChange={(e) => set('titleDeedIssuedFrom', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Section 8: Property Data (بيانات العقار) ─── */}
          <SectionHeader icon="🏠" title="بيانات العقار — Property Details" subtitle="Section 8 — Type, usage, floors" expanded={openSections.property} onToggle={() => toggle('property')} />
          {openSections.property && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div className="form-group">
                <label>العنوان الوطني للعقار / Property National Address</label>
                <input type="text" className="form-input" placeholder="e.g. 3866, 7458, 14256"
                  value={newBuilding.nationalAddress} onChange={(e) => set('nationalAddress', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>نوع بناء العقار / Property Type</label>
                  <select className="form-input" value={newBuilding.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="فيلا">فيلا — Villa</option>
                    <option value="شقة">شقة — Apartment</option>
                    <option value="عمارة">عمارة — Building</option>
                    <option value="مكتب">مكتب — Office</option>
                    <option value="محل تجاري">محل تجاري — Retail Shop</option>
                    <option value="مستودع">مستودع — Warehouse</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>الغرض من الاستخدام / Property Usage</label>
                  <select className="form-input" value={newBuilding.propertyUsage} onChange={(e) => set('propertyUsage', e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="سكن عائلات">سكن عائلات — Family Housing</option>
                    <option value="سكن عزاب">سكن عزاب — Bachelor Housing</option>
                    <option value="تجاري">تجاري — Commercial</option>
                    <option value="صناعي">صناعي — Industrial</option>
                    <option value="مختلط">مختلط — Mixed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>عدد الطوابق / Floors</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 2"
                    value={newBuilding.numberOfFloors} onChange={(e) => set('numberOfFloors', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>عدد المواقف / Parking Lots</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 0"
                    value={newBuilding.numberOfParkingLots} onChange={(e) => set('numberOfParkingLots', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>عدد المصاعد / Elevators</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 0"
                    value={newBuilding.numberOfElevators} onChange={(e) => set('numberOfElevators', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); setNewBuilding(emptyBuilding); }}>{t('cancel')}</button>
            <button type="submit" className="btn-primary">{t('saveBuilding')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
