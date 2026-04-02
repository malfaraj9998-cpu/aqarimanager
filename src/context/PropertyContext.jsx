import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

const PropertyContext = createContext();

export function PropertyProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setBuildings([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'buildings');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const buildingsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      buildingsData.sort((a, b) => a.createdAt - b.createdAt);
      setBuildings(buildingsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const userCol = (col) => collection(db, 'users', uid, col);
  const userDoc = (col, id) => doc(db, 'users', uid, col, id);

  const addBuilding = async (buildingData) => {
    const { flatsCount, shopsCount, officesCount, ...building } = buildingData;
    const newDocRef = doc(userCol('buildings'));
    const initialUnits = [];
    let counter = 1;
    for (let i = 1; i <= (parseInt(flatsCount) || 0); i++) {
      initialUnits.push({ id: Date.now() + counter++, unitNumber: `F-${i}`, type: 'Flat', floor: 1, status: 'Available', client: null });
    }
    for (let i = 1; i <= (parseInt(shopsCount) || 0); i++) {
      initialUnits.push({ id: Date.now() + counter++, unitNumber: `S-${i}`, type: 'Shop', status: 'Available', client: null });
    }
    for (let i = 1; i <= (parseInt(officesCount) || 0); i++) {
      initialUnits.push({ id: Date.now() + counter++, unitNumber: `O-${i}`, type: 'Office', status: 'Available', client: null });
    }
    await setDoc(newDocRef, { ...building, id: newDocRef.id, units: initialUnits, createdAt: Date.now() });
  };

  const addUnit = async (buildingId, unit) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;
    const newUnit = { ...unit, id: Date.now(), status: 'Available', client: null };
    const updatedUnits = [newUnit, ...(building.units || [])];
    await updateDoc(userDoc('buildings', buildingId), { units: updatedUnits });
  };

  const updateUnit = async (buildingId, unitId, updates) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;
    const updatedUnits = building.units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    await updateDoc(userDoc('buildings', buildingId), { units: updatedUnits });
  };

  const deleteUnit = async (buildingId, unitId) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;
    const updatedUnits = building.units.filter(u => u.id !== unitId);
    await updateDoc(userDoc('buildings', buildingId), { units: updatedUnits });
  };

  const deleteBuilding = async (buildingId) => {
    await deleteDoc(userDoc('buildings', buildingId));
  };

  const assignContract = async (buildingId, unitId, clientName) => {
    await updateUnit(buildingId, unitId, { status: 'Leased', client: clientName });
  };

  const getAvailableUnits = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.units.filter(u => u.status === 'Available') : [];
  };

  const totalUnitsCount = buildings.reduce((acc, b) => acc + (b.units?.length || 0), 0);
  const leasedUnitsCount = buildings.reduce((acc, b) => acc + (b.units?.filter(u => u.status === 'Leased')?.length || 0), 0);
  const occupancyRate = totalUnitsCount > 0 ? Math.round((leasedUnitsCount / totalUnitsCount) * 100) : 0;

  return (
    <PropertyContext.Provider value={{
      buildings, loading, addBuilding, addUnit, updateUnit, deleteUnit, deleteBuilding,
      assignContract, getAvailableUnits,
      totalUnitsCount, leasedUnitsCount, occupancyRate
    }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return useContext(PropertyContext);
}
