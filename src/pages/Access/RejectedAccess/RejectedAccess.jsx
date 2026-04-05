import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { LogOut } from 'lucide-react';
import '../PendingApproval/PendingApproval.css';

export default function RejectedAccess() {
  const { logout } = useAuth();

  return (
    <div className="pending-approval-container">
      <div className="pending-card">
        <div className="status-icon rejected">🚫</div>
        <h2>Access Denied</h2>
        <p>
          Your account registration was reviewed and has been rejected by the administrator. 
          You no longer have access to this application.
        </p>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
