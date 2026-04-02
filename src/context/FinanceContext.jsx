import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setTransactions([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'finance');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const financeData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      financeData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
      setTransactions(financeData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const userCol = (col) => collection(db, 'users', uid, col);
  const userDoc = (col, id) => doc(db, 'users', uid, col, id);

  const addTransaction = async (data) => {
    const newDocRef = doc(userCol('finance'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, amount: parseFloat(data.amount), createdAt: Date.now() });
  };

  const updateTransaction = async (id, data) => {
    await updateDoc(userDoc('finance', id.toString()), { ...data, amount: parseFloat(data.amount) });
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(userDoc('finance', id.toString()));
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
