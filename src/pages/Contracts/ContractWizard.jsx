import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useClient } from '../../context/ClientContext';
import { useContract } from '../../context/ContractContext';
import { FileSignature, CheckCircle, Building2, Home, FileText, Plus, Trash2 } from 'lucide-react';
import './Contracts.css';

export default function ContractWizard() {
  const { t, formatDateDual } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buildings, assignContract } = useProperty();
  const { clients, updateClient } = useClient();
  const { activeContracts, addContract, renewContract } = useContract();

  const renewId = searchParams.get('renewId');
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — Client
    clientId: searchParams.get('clientId') || '',
    // Step 2 — Property
    buildingId: searchParams.get('buildingId') || '',
    unitId: searchParams.get('unitId') || '',
    // Step 3 — Lease Terms
    contractType: 'جديد',
    sealingDate: '',
    sealingLocation: 'الرياض',
    startDate: '',
    endDate: '',
    annualRent: '',
    paymentFrequency: 'Monthly',
    ejarContractNumber: '',
    notes: '',
    // Brokerage (Section 6)
    brokerageEntityName: '',
    brokerageCRNo: '',
    brokerageLandlineNo: '',
    brokerageFaxNo: '',
    brokerName: '',
    brokerNationality: 'المملكة العربية السعودية',
    brokerIdType: 'الهوية الوطنية',
    brokerIdNo: '',
    brokerMobile: '',
    brokerEmail: '',
    // Step 4 — Financial Data (Section 11)
    securityDeposit: '',
    electricityAnnualAmount: '',
    gasAnnualAmount: '',
    waterAnnualAmount: '',
    parkingAnnualAmount: '',
    regularRentPayment: '',
    lastRentPayment: '',
    numberOfRentPayments: '',
    totalContractValue: '',
    paymentMethods: 'مدى سداد',
    parkingLotsRented: '',
    tenantAuthority: '',
    // Section 12 — Payment Schedule
    paymentSchedule: [],
  });

  useEffect(() => {
    if (renewId && !initialized && activeContracts.length > 0) {
      const oldContract = activeContracts.find(c => c.id === renewId);
      if (oldContract) {
        setForm(prev => ({
          ...prev,
          clientId: oldContract.clientId || '',
          buildingId: oldContract.buildingId || '',
          unitId: oldContract.unitId || '',
          startDate: oldContract.endDate || '',
          endDate: '',
          annualRent: oldContract.annualRent || '',
          paymentFrequency: oldContract.paymentFrequency || 'Monthly',
          ejarContractNumber: '',
          notes: oldContract.notes || '',
        }));
      }
      setInitialized(true);
    }
  }, [renewId, activeContracts, initialized]);

  useEffect(() => {
    const isImport = searchParams.get('import') === 'true';
    if (isImport && !initialized) {
      try {
        const stored = sessionStorage.getItem('importedEjarContract');
        if (stored) {
          const data = JSON.parse(stored);
          // Clear PII from sessionStorage immediately after reading
          sessionStorage.removeItem('importedEjarContract');
          const c = data.contract || {};
          
          setForm(prev => ({
            ...prev,
            clientId: data.resolvedClientId || '',
            buildingId: data.resolvedBuildingId || '',
            unitId: data.resolvedUnitId || '',
            contractType: c.contractType || 'جديد',
            sealingDate: c.sealingDate || '',
            sealingLocation: c.sealingLocation || 'الرياض',
            startDate: c.startDate || '',
            endDate: c.endDate || '',
            annualRent: c.annualRent || '',
            paymentFrequency: c.paymentFrequency || 'Monthly',
            ejarContractNumber: c.ejarContractNumber || '',
            brokerageEntityName: c.brokerageEntityName || '',
            brokerageCRNo: c.brokerageCRNo || '',
            brokerageLandlineNo: c.brokerageLandlineNo || '',
            brokerageFaxNo: c.brokerageFaxNo || '',
            brokerName: c.brokerName || '',
            brokerNationality: c.brokerNationality || 'المملكة العربية السعودية',
            brokerIdType: c.brokerIdType || 'الهوية الوطنية',
            brokerIdNo: c.brokerIdNo || '',
            brokerMobile: c.brokerMobile || '',
            brokerEmail: c.brokerEmail || '',
            securityDeposit: c.securityDeposit || '',
            electricityAnnualAmount: c.electricityAnnualAmount || '',
            gasAnnualAmount: c.gasAnnualAmount || '',
            waterAnnualAmount: c.waterAnnualAmount || '',
            parkingAnnualAmount: c.parkingAnnualAmount || '',
            regularRentPayment: c.regularRentPayment || '',
            lastRentPayment: c.lastRentPayment || '',
            numberOfRentPayments: c.numberOfRentPayments || '',
            totalContractValue: c.totalContractValue || '',
            paymentMethods: c.paymentMethods || 'مدى سداد',
            parkingLotsRented: c.parkingLotsRented || '',
            tenantAuthority: c.tenantAuthority || '',
            paymentSchedule: data.paymentSchedule || []
          }));
        }
      } catch (err) {
        console.error("Failed to parse imported Ejar contract", err);
      }
      setInitialized(true);
    }
  }, [searchParams, initialized]);

  // Derive available units from the selected building
  const availableUnits = useMemo(() => {
    if (!form.buildingId) return [];
    const building = buildings.find(b => b.id === form.buildingId);
    return building ? building.units.filter(u => u.status === 'Available' || u.id.toString() === form.unitId.toString()) : [];
  }, [form.buildingId, form.unitId, buildings]);

  const selectedBuilding = buildings.find(b => b.id === form.buildingId);
  const selectedUnit = selectedBuilding?.units.find(u => u.id.toString() === form.unitId.toString());
  const selectedClient = clients.find(c => c.id === form.clientId);

  const handleFinalize = async () => {
    if (!form.clientId || !form.buildingId || !form.unitId || !form.startDate || !form.endDate) {
      alert('Please complete all required steps and ensure dates are set.');
      return;
    }
    if (!confirmed) {
      alert('Please verify and confirm the contract details before submitting.');
      return;
    }

    try {
      let createdContract;
      if (renewId) {
        createdContract = await renewContract(renewId, form);
      } else {
        createdContract = await addContract(form);
      }

      // Mark the unit as leased in global state
      await assignContract(form.buildingId, parseInt(form.unitId) || form.unitId, selectedClient?.name || 'Unknown Client');
      
      // Mark client status active
      if (selectedClient) {
        await updateClient(selectedClient.id, { status: 'Active' });
      }

      alert(`✅ Contract ${renewId ? 'renewed' : 'finalized'}!\nContract ID: ${createdContract.contractNumber}\nUnit: ${selectedUnit?.unitNumber} assigned to ${selectedClient?.name}`);
      navigate('/contracts');
    } catch (error) {
      console.error(error);
      alert('Error saving contract.');
    }
  };

  const canProceedStep1 = !!form.clientId;
  const canProceedStep2 = !!form.buildingId && !!form.unitId;
  const canProceedStep3 = !!form.startDate && !!form.endDate;

  // Payment schedule helpers
  const addScheduleRow = () => setForm(p => ({ ...p, paymentSchedule: [...p.paymentSchedule, { no: p.paymentSchedule.length + 1, rentalPeriodFrom: '', rentalPeriodTo: '', dueDateAD: '', dueDateAH: '', paymentDeadlineAD: '', paymentDeadlineAH: '', durationDays: '', amount: '' }] }));
  const updateScheduleRow = (i, field, val) => setForm(p => { const s = [...p.paymentSchedule]; s[i] = { ...s[i], [field]: val }; return { ...p, paymentSchedule: s }; });
  const removeScheduleRow = (i) => setForm(p => ({ ...p, paymentSchedule: p.paymentSchedule.filter((_, idx) => idx !== i) }));

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1 className="page-title">{renewId ? t('renewContractGenerator') : t('newContractGenerator')}</h1>
      </div>

      <div className="glass-panel form-container">

        {/* Stepper */}
        <div className="wizard-steps">
          {[t('step1'), t('step2'), t('step3'), 'المالية'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`step ${step >= i + 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {i < 3 && <div className={`step-line ${step > i + 1 ? 'completed' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="wizard-content">

          {/* Step 1: Select Client */}
          {step === 1 && (
            <div className="form-section">
              <h2 className="section-title">{t('clientInfo')}</h2>
              <div className="form-group">
                <label>{t('selectExistingClient')}</label>
                <select className="form-input" value={form.clientId}
                  onChange={(e) => setForm({...form, clientId: e.target.value})}>
                  <option value="">{t('chooseClient')}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {form.clientId && (
                <div className="selection-preview">
                  <Home size={20} />
                  <span>{t('chooseClient')}: <strong>{selectedClient?.name}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Building → Unit */}
          {step === 2 && (
            <div className="form-section">
              <h2 className="section-title">{t('propertySelect')}</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('buildingName')}</label>
                  <select className="form-input" value={form.buildingId}
                    onChange={(e) => setForm({...form, buildingId: e.target.value, unitId: ''})}>
                    <option value="">{t('selectBuilding')}</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('assignUnit')}</label>
                  <select className="form-input" value={form.unitId}
                    onChange={(e) => setForm({...form, unitId: e.target.value})}
                    disabled={!form.buildingId}>
                    <option value="">{form.buildingId ? t('selectAvailableUnit') : '← ' + t('selectBuilding')}</option>
                    {availableUnits.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} ({t(u.type?.toLowerCase().replace(/\s+/g, '') || u.type) || u.type}){u.floor ? ` — ${t('floor')} ${u.floor}` : ''}
                      </option>
                    ))}
                    {form.buildingId && availableUnits.length === 0 && (
                      <option disabled>{t('noUnitsFound')}</option>
                    )}
                  </select>
                </div>
              </div>
              {selectedBuilding && selectedUnit && (
                <div className="selection-preview">
                  <Building2 size={20} />
                  <span><strong>{selectedBuilding.name}</strong> → Unit <strong>{selectedUnit.unitNumber}</strong> ({selectedUnit.type}{selectedUnit.floor ? `, Floor ${selectedUnit.floor}` : ''})</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Terms & Ejar + Sealing + Brokerage */}
          {step === 3 && (
            <div className="form-section">
              <h2 className="section-title">{t('leaseTerms')}</h2>

              {/* Contract Meta */}
              <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📋 بيانات العقد — Contract Data (Section 1)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>نوع العقد / Contract Type</label>
                  <select className="form-input" value={form.contractType} onChange={(e) => setForm({...form, contractType: e.target.value})}>
                    <option value="جديد">جديد — New</option>
                    <option value="تجديد">تجديد — Renewal</option>
                    <option value="إيجار من الباطن">إيجار من الباطن — Sublease</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>مكان إبرام العقد / Sealing Location</label>
                  <input type="text" className="form-input" placeholder="e.g. الرياض"
                    value={form.sealingLocation} onChange={(e) => setForm({...form, sealingLocation: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>تاريخ إبرام العقد / Sealing Date</label>
                  <input type="date" className="form-input"
                    value={form.sealingDate} onChange={(e) => setForm({...form, sealingDate: e.target.value})} />
                </div>
              </div>

              {/* Ejar Number */}
              <div className="ejar-field">
                <div className="ejar-label">
                  <FileText size={20} className="text-primary" />
                  <span>Ejar Contract No. <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(رقم عقد إيجار)</span></span>
                </div>
                <input className="form-input ejar-input" type="text" placeholder="e.g. 10051063760"
                  value={form.ejarContractNumber} onChange={(e) => setForm({...form, ejarContractNumber: e.target.value})} />
              </div>

              {/* Dates & Rent */}
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('startDate')} — تاريخ بداية الإيجار</label>
                  <input required type="date" className="form-input" min="2010-01-01" max="2040-12-31"
                    value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
                  {form.startDate && <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>{formatDateDual(form.startDate).split(' / ')[1]} (Hijri)</div>}
                </div>
                <div className="form-group">
                  <label>{t('endDate')} — تاريخ نهاية الإيجار</label>
                  <input required type="date" className="form-input" min="2010-01-01" max="2040-12-31"
                    value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
                  {form.endDate && <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>{formatDateDual(form.endDate).split(' / ')[1]} (Hijri)</div>}
                </div>
                <div className="form-group">
                  <label>قيمة الإيجار السنوي / Annual Rent (SAR)</label>
                  <input type="number" className="form-input" placeholder="e.g. 30500"
                    value={form.annualRent} onChange={(e) => setForm({...form, annualRent: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>دورة سداد الإيجار / Payment Cycle</label>
                  <select className="form-input" value={form.paymentFrequency} onChange={(e) => setForm({...form, paymentFrequency: e.target.value})}>
                    <option value="Monthly">شهري — Monthly</option>
                    <option value="Quarterly">ربع سنوي — Quarterly</option>
                    <option value="Half Yearly">نصف سنوي — Half Yearly</option>
                    <option value="Annually">سنوي — Annually</option>
                    <option value="دفعة مرة واحدة">دفعة مرة واحدة — One-time</option>
                  </select>
                </div>
              </div>

              {/* Brokerage Section 6 */}
              <div style={{ padding: '0.5rem 0.75rem', margin: '1rem 0 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🏢 بيانات الوساطة — Brokerage (Section 6)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>اسم منشأة الوساطة / Brokerage Name</label>
                  <input type="text" className="form-input" placeholder="e.g. مكتب رئي المستقبل للعقارات"
                    value={form.brokerageEntityName} onChange={(e) => setForm({...form, brokerageEntityName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>رقم السجل التجاري / CR No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 1010315024"
                    value={form.brokerageCRNo} onChange={(e) => setForm({...form, brokerageCRNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>اسم الموظف / Broker Name</label>
                  <input type="text" className="form-input" placeholder="e.g. هشام عبدالله علي القائم"
                    value={form.brokerName} onChange={(e) => setForm({...form, brokerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>نوع الهوية / Broker ID Type</label>
                  <select className="form-input" value={form.brokerIdType} onChange={(e) => setForm({...form, brokerIdType: e.target.value})}>
                    <option value="الهوية الوطنية">الهوية الوطنية</option>
                    <option value="إقامة">إقامة</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>رقم هوية الموظف / Broker ID No.</label>
                  <input type="text" className="form-input" placeholder="e.g. 1029501929"
                    value={form.brokerIdNo} onChange={(e) => setForm({...form, brokerIdNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>جوال الموظف / Broker Mobile</label>
                  <input type="tel" className="form-input" placeholder="+966569900997"
                    value={form.brokerMobile} onChange={(e) => setForm({...form, brokerMobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>بريد الموظف / Broker Email</label>
                  <input type="email" className="form-input" placeholder="broker@email.com"
                    value={form.brokerEmail} onChange={(e) => setForm({...form, brokerEmail: e.target.value})} />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>{t('notes')}</label>
                <input type="text" className="form-input" placeholder="Additional notes..."
                  value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>

              {/* Contract Summary */}
              <div className="contract-summary-card">
                <h3 className="summary-title">{t('contractSummary')}</h3>
                <div className="summary-grid">
                  <div className="summary-row"><span>نوع العقد</span><strong>{form.contractType}</strong></div>
                  <div className="summary-row"><span>{t('client')}</span><strong>{selectedClient?.name || '—'}</strong></div>
                  <div className="summary-row"><span>{t('buildings')}</span><strong>{selectedBuilding?.name || '—'}</strong></div>
                  <div className="summary-row"><span>{t('units')}</span><strong>{selectedUnit?.unitNumber} ({t(selectedUnit?.type?.toLowerCase() || selectedUnit?.type) || selectedUnit?.type})</strong></div>
                  <div className="summary-row"><span>الإيجار السنوي</span><strong>SAR {parseInt(form.annualRent || 0).toLocaleString()}</strong></div>
                  <div className="summary-row"><span>{t('startDate')}</span><strong>{formatDateDual(form.startDate)}</strong></div>
                  <div className="summary-row"><span>{t('endDate')}</span><strong>{formatDateDual(form.endDate)}</strong></div>
                  <div className="summary-row"><span>{t('contractIdEjar')}</span><strong>{form.ejarContractNumber || '—'}</strong></div>
                </div>
                <div className="contract-notice">
                  <FileSignature size={18} />
                  <span>{t('uponSubmission')}</span>
                </div>
              </div>

              {/* Verification Checkbox */}
              <label className={`verify-checkbox-label ${confirmed ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="verify-checkbox-input"
                />
                <span className="verify-checkbox-box">
                  {confirmed && <CheckCircle size={14} />}
                </span>
                <span className="verify-checkbox-text">
                  I have reviewed all contract details, confirmed the Ejar contract number, and authorize this lease agreement to be finalized.
                  <br />
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    لقد راجعت جميع تفاصيل العقد وأوافق على إتمام هذا الإيجار.
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* Step 4: Financial Data (Section 11) + Payment Schedule (Section 12) */}
          {step === 4 && (
            <div className="form-section">
              <h2 className="section-title">البيانات المالية — Financial Data</h2>

              {/* Section 11 */}
              <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>💰 البيانات المالية — Financial Terms (Section 11)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>مبلغ الضمان / Security Deposit (SAR) <span style={{fontSize:'0.72rem', opacity:0.6}}>(not in total)</span></label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 5000"
                    value={form.securityDeposit} onChange={(e) => setForm({...form, securityDeposit: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>دفعة الإيجار الدورية / Regular Rent Payment (SAR)</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 61000"
                    value={form.regularRentPayment} onChange={(e) => setForm({...form, regularRentPayment: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>دفعة الإيجار الأخيرة / Last Rent Payment (SAR)</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 61000"
                    value={form.lastRentPayment} onChange={(e) => setForm({...form, lastRentPayment: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>عدد دفعات الإيجار / Number of Payments</label>
                  <input type="number" min="1" className="form-input" placeholder="e.g. 1"
                    value={form.numberOfRentPayments} onChange={(e) => setForm({...form, numberOfRentPayments: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>إجمالي قيمة العقد / Total Contract Value (SAR)</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 61000"
                    value={form.totalContractValue} onChange={(e) => setForm({...form, totalContractValue: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>قنوات الدفع المتاحة / Payment Methods</label>
                  <input type="text" className="form-input" placeholder="e.g. مدى سداد"
                    value={form.paymentMethods} onChange={(e) => setForm({...form, paymentMethods: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>عدد المواقف المستأجرة / Parking Lots Rented</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 0"
                    value={form.parkingLotsRented} onChange={(e) => setForm({...form, parkingLotsRented: e.target.value})} />
                </div>
              </div>

              {/* Utilities */}
              <div style={{ padding: '0.5rem 0.75rem', margin: '1rem 0 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⚡ أجرة الخدمات السنوية — Annual Utility Amounts</div>
              <div className="form-grid">
                {[
                  { label: '⚡ أجرة الكهرباء / Electricity', field: 'electricityAnnualAmount' },
                  { label: '🔥 أجرة الغاز / Gas', field: 'gasAnnualAmount' },
                  { label: '💧 أجرة المياه / Water', field: 'waterAnnualAmount' },
                  { label: '🚗 أجرة المواقف / Parking', field: 'parkingAnnualAmount' },
                ].map(({ label, field }) => (
                  <div key={field} className="form-group">
                    <label>{label} (SAR)</label>
                    <input type="number" min="0" className="form-input" placeholder="0.00"
                      value={form[field]} onChange={(e) => setForm({...form, [field]: e.target.value})} />
                  </div>
                ))}
              </div>

              {/* Tenant Authority (Section 10) */}
              <div style={{ padding: '0.5rem 0.75rem', margin: '1rem 0 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📋 صلاحيات المستأجر — Tenant Authority (Section 10)</div>
              <div className="form-group">
                <label>نص الصلاحيات / Authority Text</label>
                <textarea className="form-input" rows={2} placeholder="أي صلاحيات أو تصاريح خاصة للمستأجر..."
                  style={{ resize: 'vertical' }}
                  value={form.tenantAuthority} onChange={(e) => setForm({...form, tenantAuthority: e.target.value})} />
              </div>

              {/* Payment Schedule (Section 12) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', margin: '1rem 0 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📅 جدول سداد الدفعات — Payment Schedule (Section 12)</span>
                <button type="button" className="btn-secondary" onClick={addScheduleRow}
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> إضافة دفعة
                </button>
              </div>
              {form.paymentSchedule.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  اضغط "إضافة دفعة" لإضافة جدول السداد
                </div>
              )}
              {form.paymentSchedule.map((row, i) => (
                <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>دفعة رقم {row.no}</span>
                    <button type="button" onClick={() => removeScheduleRow(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-text)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group"><label>الفترة من / Period From</label>
                      <input type="date" className="form-input" value={row.rentalPeriodFrom} onChange={(e) => updateScheduleRow(i, 'rentalPeriodFrom', e.target.value)} /></div>
                    <div className="form-group"><label>الفترة إلى / Period To</label>
                      <input type="date" className="form-input" value={row.rentalPeriodTo} onChange={(e) => updateScheduleRow(i, 'rentalPeriodTo', e.target.value)} /></div>
                    <div className="form-group"><label>تاريخ الاستحقاق (AD)</label>
                      <input type="date" className="form-input" value={row.dueDateAD} onChange={(e) => updateScheduleRow(i, 'dueDateAD', e.target.value)} /></div>
                    <div className="form-group"><label>تاريخ الاستحقاق (AH) هجري</label>
                      <input type="text" className="form-input" placeholder="e.g. 1445-10-06" value={row.dueDateAH} onChange={(e) => updateScheduleRow(i, 'dueDateAH', e.target.value)} /></div>
                    <div className="form-group"><label>نهاية مهلة السداد (AD)</label>
                      <input type="date" className="form-input" value={row.paymentDeadlineAD} onChange={(e) => updateScheduleRow(i, 'paymentDeadlineAD', e.target.value)} /></div>
                    <div className="form-group"><label>نهاية مهلة السداد (AH) هجري</label>
                      <input type="text" className="form-input" placeholder="e.g. 1445-11-07" value={row.paymentDeadlineAH} onChange={(e) => updateScheduleRow(i, 'paymentDeadlineAH', e.target.value)} /></div>
                    <div className="form-group"><label>المدة / Duration (يوم)</label>
                      <input type="number" min="0" className="form-input" placeholder="e.g. 729" value={row.durationDays} onChange={(e) => updateScheduleRow(i, 'durationDays', e.target.value)} /></div>
                    <div className="form-group"><label>القيمة / Amount (SAR)</label>
                      <input type="number" min="0" className="form-input" placeholder="e.g. 61000" value={row.amount} onChange={(e) => updateScheduleRow(i, 'amount', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="wizard-actions">
          {step > 1
            ? <button className="btn-secondary" onClick={() => setStep(step - 1)}>{t('back')}</button>
            : <div />}
          {step < 3
            ? <button className="btn-primary"
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                onClick={() => setStep(step + 1)}>{t('continue')}</button>
            : step === 3
            ? <button className="btn-primary"
                disabled={!canProceedStep3}
                onClick={() => setStep(4)}>{t('continue')} → البيانات المالية</button>
            : <button
                className="btn-primary"
                onClick={handleFinalize}
                disabled={!confirmed}
                title={!confirmed ? 'Please verify the contract details first' : ''}>
                <CheckCircle size={18} style={{ display: 'inline', marginInlineEnd: '8px' }} />
                {t('finalizeContract')}
              </button>}
        </div>

      </div>
    </div>
  );
}

