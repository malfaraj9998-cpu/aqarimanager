import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { LogOut } from 'lucide-react';
import './PendingApproval.css';

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="pending-approval-container">
      <div className="pending-card">
        <div className="status-icon pending">⏳</div>
        <h2>Account Pending Approval</h2>
        <p>
          Your registration is complete, but you need administrator approval before you can access your database. 
          Please wait until an admin activates your account.
        </p>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
