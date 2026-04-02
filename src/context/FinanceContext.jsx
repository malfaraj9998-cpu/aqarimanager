import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const FinanceContext = createContext();

const initialTransactions = [];

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'finance'), async (snapshot) => {
      if (snapshot.empty && !loading) {
        setTransactions([]);
        setLoading(false);
      } else {
        const financeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        financeData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
        setTransactions(financeData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loading]);

  const addTransaction = async (data) => {
    const newDocRef = doc(collection(db, 'finance'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, amount: parseFloat(data.amount), createdAt: Date.now() });
  };

  const updateTransaction = async (id, data) => {
    await updateDoc(doc(db, 'finance', id.toString()), { ...data, amount: parseFloat(data.amount) });
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, 'finance', id.toString()));
  };

  return (
    <FinanceContext.Provider value={{ transactions, loading, addTransaction, updateTransaction, deleteTransaction }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

