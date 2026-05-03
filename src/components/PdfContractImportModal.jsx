import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { extractContractData } from '../utils/contractPdfExtractor';
import { useProperty } from '../context/PropertyContext';
import { useClient } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';

export default function PdfContractImportModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addBuilding, buildings } = useProperty();
  const { addClient, clients } = useClient();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'loading' | 'review'

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setStep('loading');
    setError(null);

    try {
      const data = await extractContractData(file);
      setParsedData(data);
      setStep('review');
    } catch (err) {
      console.error(err);
      setError('Failed to extract data from PDF. Please make sure it is a valid Ejar contract.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      // 1. Create or Find Client
      let clientId = '';
      if (parsedData.client?.vat) {
        const existingClient = clients.find(c => c.vat === parsedData.client.vat);
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const newClient = await addClient(parsedData.client);
          clientId = newClient.id;
        }
      }

      // 2. Create or Find Building
      let buildingId = '';
      if (parsedData.building?.name || parsedData.building?.titleDeedNo) {
        const existingBuilding = buildings.find(b => 
          (parsedData.building.titleDeedNo && b.titleDeedNo === parsedData.building.titleDeedNo) || 
          b.name === parsedData.building.name
        );
        if (existingBuilding) {
          buildingId = existingBuilding.id;
        } else {
          // Can be created manually later if missing
        }
      }

      // Attach resolved IDs to the payload
      parsedData.resolvedClientId = clientId;
      parsedData.resolvedBuildingId = buildingId;

      // To keep it simple and robust, we will store the parsed data in sessionStorage
      // and navigate to the Contract Wizard. The wizard will read it and pre-fill everything.
      sessionStorage.setItem('importedEjarContract', JSON.stringify(parsedData));
      
      onClose();
      // Reset state
      setFile(null);
      setParsedData(null);
      setStep('upload');

      navigate(`/contracts/new?import=true`);

    } catch (err) {
      console.error(err);
      setError('An error occurred while approving the data.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="استيراد عقد إيجار من PDF — Import Ejar Contract">
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <FileText size={48} className="text-primary" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload Arabic Ejar PDF</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
              Our AI will automatically extract the tenant, building, unit, financial terms, and payment schedule.
            </p>
          </div>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '150px', border: '2px dashed var(--border-color)', borderRadius: '12px',
            cursor: 'pointer', background: 'var(--bg-secondary)', transition: 'all 0.2s'
          }}>
            <Upload size={24} className="text-secondary" style={{ marginBottom: '0.5rem' }} />
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Click to browse or drag PDF here</span>
            <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--accent-primary)', width: '100%' }}>
              <FileText size={18} />
              <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              <CheckCircle size={18} />
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-text)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button className="btn-primary" disabled={!file} onClick={handleExtract}>
              Extract Data
            </button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
          <Loader size={40} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Analyzing Contract...</h3>
          <p className="text-secondary" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Extracting 78 fields including lessor data, building metrics, unit specifications, and the full payment schedule. This may take 10-20 seconds.
          </p>
        </div>
      )}

      {step === 'review' && parsedData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> Data Extracted Successfully
            </h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Please review the extracted highlights below. You will be able to edit all details in the Contract Wizard before saving.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tenant (Client)</strong>
                <div>{parsedData.client?.name || '—'}</div>
                <div style={{ opacity: 0.7 }}>ID: {parsedData.client?.vat || '—'}</div>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Lessor (Building Owner)</strong>
                <div>{parsedData.building?.ownerName || '—'}</div>
                <div style={{ opacity: 0.7 }}>Deed: {parsedData.building?.titleDeedNo || '—'}</div>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Unit & Rent</strong>
                <div>Unit {parsedData.unit?.unitNumber || '—'} ({parsedData.unit?.type || '—'})</div>
                <div style={{ opacity: 0.7 }}>SAR {parsedData.contract?.annualRent || '0'} / Year</div>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Contract Dates</strong>
                <div>Start: {parsedData.contract?.startDate || '—'}</div>
                <div style={{ opacity: 0.7 }}>End: {parsedData.contract?.endDate || '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Schedule</strong>
                <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '6px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                  Found {parsedData.paymentSchedule?.length || 0} scheduled payments.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setStep('upload')}>Cancel & Re-upload</button>
            <button className="btn-primary" onClick={handleApprove}>
              Approve & Continue to Wizard
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
