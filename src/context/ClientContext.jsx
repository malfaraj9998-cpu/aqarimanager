import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

const ClientContext = createContext();

export function ClientProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setClients([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'clients');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const clientsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      clientsData.sort((a, b) => b.createdAt - a.createdAt);
      setClients(clientsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const userCol = (col) => collection(db, 'users', uid, col);
  const userDoc = (col, id) => doc(db, 'users', uid, col, id);

  const addClient = async (data) => {
    const newDocRef = doc(userCol('clients'));
    await setDoc(newDocRef, { ...data, id: newDocRef.id, createdAt: Date.now() });
  };

  const updateClient = async (id, data) => {
    await updateDoc(userDoc('clients', id.toString()), data);
  };

  const deleteClient = async (id) => {
    await deleteDoc(userDoc('clients', id.toString()));
  };

  return (
    <ClientContext.Provider value={{ clients, loading, addClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
