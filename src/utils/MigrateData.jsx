import React, { useState } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * ONE-TIME Migration Utility
 * Moves data from flat Firestore collections to user-scoped sub-collections.
 * Remove this component from App.jsx after migration is complete.
 */
export default function MigrateData() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const migrateCollection = async (fromCol, toCol) => {
    const uid = currentUser.uid;
    const sourceRef = collection(db, fromCol);
    const snapshot = await getDocs(sourceRef);
    if (snapshot.empty) { addLog(`⚠️ "${fromCol}" is empty — skipped.`); return; }
    let count = 0;
    for (const docSnap of snapshot.docs) {
      const destRef = doc(db, 'users', uid, toCol, docSnap.id);
      await setDoc(destRef, docSnap.data());
      count++;
    }
    addLog(`✅ Migrated ${count} records from "/${fromCol}" → "/users/${uid}/${toCol}"`);
  };

  const handleMigrate = async () => {
    if (!currentUser) { alert('You must be logged in.'); return; }
    setStatus('running');
    setLog([]);
    try {
      addLog('🚀 Starting migration...');
      await migrateCollection('buildings', 'buildings');
      await migrateCollection('contracts', 'contracts');
      await migrateCollection('clients', 'clients');
      await migrateCollection('finance', 'finance');
      addLog('');
      addLog('🎉 Migration complete! Your data is now private to your account.');
      addLog('⚠️ IMPORTANT: You can now remove MigrateData from App.jsx.');
      setStatus('done');
    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus('error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#0f172a', border: '1px solid #334155', borderRadius: '1rem',
        padding: '2rem', maxWidth: '520px', width: '90%', color: '#f1f5f9'
      }}>
        <h2 style={{ margin: '0 0 0.5rem', color: '#38bdf8' }}>🔄 Data Migration Required</h2>
        <p style={{ color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
          This one-time action moves your existing data (buildings, contracts, clients, transactions)
          to your private user account. It will NOT delete the originals automatically.
        </p>

        {log.length > 0 && (
          <div style={{
            background: '#1e293b', borderRadius: '0.5rem', padding: '1rem',
            marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6
          }}>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {status === 'idle' && (
          <button onClick={handleMigrate} style={{
            background: '#38bdf8', color: '#0f172a', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
            fontWeight: 700, cursor: 'pointer', width: '100%'
          }}>
            Start Migration
          </button>
        )}

        {status === 'running' && (
          <p style={{ color: '#fbbf24', textAlign: 'center' }}>⏳ Migrating data, please wait...</p>
        )}

        {status === 'done' && (
          <p style={{ color: '#4ade80', textAlign: 'center', fontWeight: 600 }}>
            ✅ Done! Please close this window, remove MigrateData from App.jsx, and refresh.
          </p>
        )}

        {status === 'error' && (
          <button onClick={handleMigrate} style={{
            background: '#ef4444', color: '#fff', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
            fontWeight: 700, cursor: 'pointer', width: '100%'
          }}>
            Retry Migration
          </button>
        )}
      </div>
    </div>
  );
}
