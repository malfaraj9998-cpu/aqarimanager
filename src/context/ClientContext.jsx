import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const ClientContext = createContext();

const initialClients = [];

export function ClientProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), async (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      clientsData.sort((a, b) => b.createdAt - a.createdAt); // newest first
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addClient = async (data) => {
    const newDocRef = doc(collection(db, 'clients'));
    await setDoc(newDocRef, { 
      ...data, 
      id: newDocRef.id, 
      createdAt: Date.now() 
    });
  };

  const updateClient = async (id, data) => {
    await updateDoc(doc(db, 'clients', id.toString()), data);
  };

  const deleteClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id.toString()));
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

