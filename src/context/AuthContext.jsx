import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'normal'
  const [userStatus, setUserStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          const isSuper = user.email.toLowerCase() === 'malfaraj9998@gmail.com';
          setIsSuperAdmin(isSuper);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role || 'admin');
            
            let currentStatus = data.status;
            if (!currentStatus) {
              // Retroactively approve existing users (including the super admin)
              currentStatus = 'approved';
              await setDoc(userDocRef, { status: currentStatus }, { merge: true });
            }
            setUserStatus(currentStatus);
          } else {
            // New user sign up
            const newRole = 'admin'; // they are admin of their own isolated database
            const initialStatus = isSuper ? 'approved' : 'pending';
            await setDoc(userDocRef, { email: user.email, role: newRole, status: initialStatus });
            setUserRole(newRole);
            setUserStatus(initialStatus);
          }
        } catch (error) {
          console.error("Error setting up user profile:", error);
          setUserStatus('rejected'); // Fallback to rejected so they don't hang if DB fails
        }

      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setIsSuperAdmin(false);
      }
      setLoading(false);

    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    userStatus,
    isSuperAdmin,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
