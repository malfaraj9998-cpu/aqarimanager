import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { ShieldCheck, XCircle, Clock } from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error fetching users. Check Firestore Security Rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this user as ${newStatus}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="admin-panel-container">
      <div className="page-header">
        <h1 className="page-title">Super Admin Panel</h1>
        <p className="text-muted">Manage user registrations and permissions.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email} {user.email === 'malfaraj9998@gmail.com' && <span className="badge super">Super</span>}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'approved' && <ShieldCheck size={14} />}
                    {user.status === 'pending' && <Clock size={14} />}
                    {user.status === 'rejected' && <XCircle size={14} />}
                    {user.status || 'approved'}
                  </span>
                </td>
                <td>
                  {user.email !== 'malfaraj9998@gmail.com' && (
                    <div className="action-buttons">
                      {user.status !== 'approved' && (
                        <button onClick={() => handleUpdateStatus(user.id, 'approved')} className="btn-approve">Approve</button>
                      )}
                      {user.status !== 'rejected' && (
                        <button onClick={() => handleUpdateStatus(user.id, 'rejected')} className="btn-reject">Reject</button>
                      )}
                      {user.status !== 'pending' && (
                        <button onClick={() => handleUpdateStatus(user.id, 'pending')} className="btn-pending">Suspend</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-4">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
