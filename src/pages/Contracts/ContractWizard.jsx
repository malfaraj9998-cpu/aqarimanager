import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useProperty } from '../../context/PropertyContext';
import { useClient } from '../../context/ClientContext';
import { useContract } from '../../context/ContractContext';
import { FileSignature, CheckCircle, Building2, Home, FileText } from 'lucide-react';
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
    clientId: searchParams.get('clientId') || '',
    buildingId: searchParams.get('buildingId') || '',
    unitId: searchParams.get('unitId') || '',
    startDate: '',
    endDate: '',
    annualRent: '',
    paymentFrequency: 'monthly',
    ejarContractNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (renewId && !initialized && activeContracts.length > 0) {
      const oldContract = activeContracts.find(c => c.id === renewId);
      if (oldContract) {
        setForm({
          clientId: oldContract.clientId || '',
          buildingId: oldContract.buildingId || '',
          unitId: oldContract.unitId || '',
          startDate: oldContract.endDate || '', // Start exactly when old ends
          endDate: '', // Let them pick new end date
          annualRent: oldContract.annualRent || '',
          paymentFrequency: oldContract.paymentFrequency || 'monthly',
          ejarContractNumber: '', // They must submit a new ejar
          notes: oldContract.notes || '',
        });
      }
      setInitialized(true);
    }
  }, [renewId, activeContracts, initialized]);

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

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1 className="page-title">{renewId ? t('renewContractGenerator') : t('newContractGenerator')}</h1>
      </div>

      <div className="glass-panel form-container">

        {/* Stepper */}
        <div className="wizard-steps">
          {[t('step1'), t('step2'), t('step3')].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`step ${step >= i + 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {i < 2 && <div className={`step-line ${step > i + 1 ? 'completed' : ''}`} />}
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

          {/* Step 3: Terms & Ejar */}
          {step === 3 && (
            <div className="form-section">
              <h2 className="section-title">{t('leaseTerms')}</h2>
              
              {/* Ejar Contract Number - Prominent Field */}
              <div className="ejar-field">
                <div className="ejar-label">
                  <FileText size={20} className="text-primary" />
                  <span>Ejar Contract Number <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(رقم عقد إيجار)</span></span>
                </div>
                <input className="form-input ejar-input"
                  type="text"
                  placeholder="e.g. 7023xxxxxxxx"
                  value={form.ejarContractNumber}
                  onChange={(e) => setForm({...form, ejarContractNumber: e.target.value})}
                />
              </div>

              <div className="form-grid">
                 <div className="form-group">
                   <label>{t('startDate')}</label>
                   <input type="date" className="form-input"
                     min="2010-01-01" max="2040-12-31"
                     value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
                   {form.startDate && (
                     <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                        {formatDateDual(form.startDate).split(' / ')[1]} (Hijri)
                     </div>
                   )}
                 </div>
                <div className="form-group">
                  <label>{t('endDate')}</label>
                  <input type="date" className="form-input"
                    min="2010-01-01" max="2040-12-31"
                    value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
                  {form.endDate && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                       {formatDateDual(form.endDate).split(' / ')[1]} (Hijri)
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>{t('annualRent')}</label>
                  <input type="number" className="form-input" placeholder="e.g. 150000"
                    value={form.annualRent} onChange={(e) => setForm({...form, annualRent: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('paymentFrequency')}</label>
                  <select className="form-input" value={form.paymentFrequency} onChange={(e) => setForm({...form, paymentFrequency: e.target.value})}>
                    <option value="Monthly">{t('monthly')}</option>
                    <option value="Quarterly">{t('quarterly')}</option>
                    <option value="Half Yearly">{t('halfYearly')}</option>
                    <option value="Annually">{t('annually')}</option>
                  </select>
                </div>
              </div>

              {/* Contract Summary */}
              <div className="contract-summary-card">
                <h3 className="summary-title">{t('contractSummary')}</h3>
                <div className="summary-grid">
                  <div className="summary-row"><span>{t('client')}</span><strong>{selectedClient?.name || '—'}</strong></div>
                  <div className="summary-row"><span>{t('buildings')}</span><strong>{selectedBuilding?.name || '—'}</strong></div>
                  <div className="summary-row"><span>{t('units')}</span><strong>{selectedUnit?.unitNumber} ({t(selectedUnit?.type?.toLowerCase() || selectedUnit?.type) || selectedUnit?.type})</strong></div>
                  <div className="summary-row"><span>{t('annualRentAmount')}</span><strong>{t('currencySAR') || 'SAR'} {parseInt(form.annualRent || 0).toLocaleString()}</strong></div>
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
            : <button
                className="btn-primary"
                onClick={handleFinalize}
                disabled={!confirmed}
                title={!confirmed ? 'Please verify the contract details first' : ''}
              >
                <CheckCircle size={18} style={{ display: 'inline', marginInlineEnd: '8px' }} />
                {t('finalizeContract')}
              </button>}
        </div>

      </div>
    </div>
  );
}

