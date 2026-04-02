import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABXiSfA-Ej5a8bvAx_LurAcwsw5sCRiTM",
  authDomain: "aqari-manager.firebaseapp.com",
  projectId: "aqari-manager",
  storageBucket: "aqari-manager.firebasestorage.app",
  messagingSenderId: "114750850351",
  appId: "1:114750850351:web:1baa76a94a676280de8dda",
  measurementId: "G-CR1HVSLWZ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Authentication & Database instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
