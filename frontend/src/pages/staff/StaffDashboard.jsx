import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingCheckins, approveCheckin } from '../../services/api';
import { CheckCircle, Clock, AlertTriangle, LogOut, User, Check, DollarSign } from 'lucide-react';
import styles from './StaffDashboard.module.css';

export default function StaffDashboard() {
  const [pendingVisits, setPendingVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const navigate = useNavigate();

  const userStr = localStorage.getItem('kabakal_user');
  const user = userStr ? JSON.parse(userStr) : null;

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

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    localStorage.removeItem('kabakal_user');
    navigate('/login');
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && pendingVisits.length === 0) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading Front Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <img src="/monogram-logo.png" alt="KG Logo" className={styles.logoImg} />
          <h1>Kabakal Gym</h1>
        </div>
        <div className={styles.navRight}>
          <div className={styles.userInfo}>
            <User size={18} className={styles.userIcon} />
            <span>{user?.firstName || 'Staff'}</span>
            <span className={styles.roleBadge}>Front Desk</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <h2>Staff Dashboard</h2>
          <p>Manage Walk-in Day Passes and Pending Payments</p>
        </header>

        {error && <div className={styles.errorBanner}><AlertTriangle size={20}/> {error}</div>}
        {actionMessage && <div className={styles.successBanner}><CheckCircle size={20}/> {actionMessage}</div>}

        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <div className={styles.listTitleGroup}>
              <h3>Pending Payments</h3>
              <span className={styles.badge}>{pendingVisits.length}</span>
            </div>
            <div className={styles.liveIndicator}>
              <span className={styles.pulse}></span>
              <span>Live Queue</span>
            </div>
          </div>

          {pendingVisits.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <Check size={48} color="#ffcc00" />
              </div>
              <h4>All caught up!</h4>
              <p>No pending walk-ins at the moment.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {pendingVisits.map((visit) => (
                <div key={visit.visitId} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardAvatar}>
                      {visit.fullName.charAt(0)}
                    </div>
                    <div className={styles.cardTitle}>
                      <h4>{visit.fullName}</h4>
                      <span className={styles.time}><Clock size={12}/> {formatTime(visit.checkInTime)}</span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.email}>{visit.email}</p>
                    <div className={styles.statusBadge}>
                      <DollarSign size={14} />
                      Pending ₱50 Cash
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <button 
                      className={styles.acceptBtn}
                      onClick={() => handleApprove(visit.visitId, visit.fullName)}
                    >
                      <CheckCircle size={18} />
                      Accept ₱50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
