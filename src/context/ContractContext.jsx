import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

const ContractContext = createContext();

export function ContractProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setContracts([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'contracts');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const contractsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      contractsData.sort((a, b) => b.createdAt - a.createdAt);
      setContracts(contractsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const userCol = (col) => collection(db, 'users', uid, col);
  const userDoc = (col, id) => doc(db, 'users', uid, col, id);

  const generateContractNumber = (existingContracts, startDate) => {
    const startYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    const yearContracts = existingContracts.filter(c => c.contractNumber?.startsWith(`${startYear}-`));
    let maxNum = 0;
    yearContracts.forEach(c => {
      const parts = c.contractNumber.split('-');
      if (parts.length === 2 && parseInt(parts[0]) === startYear) {
        const num = parseInt(parts[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${startYear}-${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const addContract = async (data) => {
    const newDocRef = doc(userCol('contracts'));
    const contractNumber = generateContractNumber(contracts, data.startDate);
    const newContract = {
      ...data,
      id: newDocRef.id,
      contractNumber,
      createdAt: Date.now(),
      status: 'Active'
    };
    await setDoc(newDocRef, newContract);
    return newContract;
  };

  const archiveContract = async (id) => {
    await updateDoc(userDoc('contracts', id), { status: 'Archived' });
  };

  const renewContract = async (oldContractId, newData) => {
    await archiveContract(oldContractId);
    return await addContract(newData);
  };

  const activeContracts = contracts.filter(c => c.status === 'Active');
  const archivedContracts = contracts.filter(c => c.status === 'Archived');

  return (
    <ContractContext.Provider value={{
      contracts, activeContracts, archivedContracts,
      addContract, archiveContract, renewContract, loading
    }}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  return useContext(ContractContext);
}
