import React, { useState, useEffect } from 'react';
import { getPendingCheckins, approveCheckin } from '../../services/api';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import styles from './StaffDashboard.module.css';

export default function StaffDashboard() {
  const [pendingVisits, setPendingVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchPending = async () => {
    try {
      const data = await getPendingCheckins();
      setPendingVisits(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending check-ins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const intervalId = setInterval(fetchPending, 3000); // Poll every 3 seconds
    return () => clearInterval(intervalId);
  }, []);

  const handleApprove = async (visitId, name) => {
    try {
      await approveCheckin(visitId);
      setActionMessage(`Approved ${name} and recorded ₱50 cash payment.`);
      fetchPending(); // Immediate refresh
      
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to approve check-in.');
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && pendingVisits.length === 0) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loading}>Loading pending walk-ins...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Staff Dashboard</h1>
        <p>Manage Walk-in Day Passes</p>
      </header>

      {error && <div className={styles.errorBanner}><AlertTriangle size={20}/> {error}</div>}
      {actionMessage && <div className={styles.successBanner}><CheckCircle size={20}/> {actionMessage}</div>}

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <h2>Pending Payments ({pendingVisits.length})</h2>
          <span className={styles.liveIndicator}>
            <span className={styles.pulse}></span> Live
          </span>
        </div>

        {pendingVisits.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle size={48} color="var(--success-color)" />
            <p>All clear! No pending walk-ins.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {pendingVisits.map((visit) => (
              <div key={visit.visitId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{visit.fullName}</h3>
                  <span className={styles.time}><Clock size={14}/> {formatTime(visit.checkInTime)}</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.email}>{visit.email}</p>
                  <p className={styles.status}>Pending ₱50 Cash Payment</p>
                </div>
                <div className={styles.cardFooter}>
                  <button 
                    className={styles.acceptBtn}
                    onClick={() => handleApprove(visit.visitId, visit.fullName)}
                  >
                    Accept ₱50 Cash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
