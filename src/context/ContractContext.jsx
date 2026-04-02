import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const ContractContext = createContext();

export function ContractProvider({ children }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'contracts'), async (snapshot) => {
      if (!snapshot.empty) {
        const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort descending by creation date
        contractsData.sort((a, b) => b.createdAt - a.createdAt);
        setContracts(contractsData);
      } else {
        setContracts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Generate ID e.g., 2026-001
  const generateContractNumber = (existingContracts, startDate) => {
    const startYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    const yearContracts = existingContracts.filter(c => c.contractNumber?.startsWith(`${startYear}-`));
    
    // Find highest sequence
    let maxNum = 0;
    yearContracts.forEach(c => {
      const parts = c.contractNumber.split('-');
      if (parts.length === 2 && parseInt(parts[0]) === startYear) {
        const num = parseInt(parts[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `${startYear}-${nextNum.toString().padStart(3, '0')}`;
  };

  const addContract = async (data) => {
    const newDocRef = doc(collection(db, 'contracts'));
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
    await updateDoc(doc(db, 'contracts', id), { status: 'Archived' });
  };

  const renewContract = async (oldContractId, newData) => {
    // 1. Archive the old contract
    await archiveContract(oldContractId);
    // 2. Add the new contract
    return await addContract(newData);
  };

  // Helper selectors
  const activeContracts = contracts.filter(c => c.status === 'Active');
  const archivedContracts = contracts.filter(c => c.status === 'Archived');

  return (
    <ContractContext.Provider value={{
      contracts,
      activeContracts,
      archivedContracts,
      addContract,
      archiveContract,
      renewContract,
      loading
    }}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  return useContext(ContractContext);
}
