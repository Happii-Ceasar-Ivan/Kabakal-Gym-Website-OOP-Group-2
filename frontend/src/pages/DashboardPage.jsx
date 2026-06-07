import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScannerModal from './kiosk/QRScannerModal';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Read user info from localStorage
  const userRaw = localStorage.getItem('kabakal_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    localStorage.removeItem('kabakal_user');
    navigate('/login');
  };

  // If no user is logged in, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <img src="/monogram-logo.png" alt="Kabakal Gym" className={styles.logo} />
          <h1 className={styles.brandName}>Kabakal Gym</h1>
        </div>
        <div className={styles.userSection}>
          <span className={styles.greeting}>
            Welcome, <strong>{user.firstName}</strong>!
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.constructionCard}>
          <div className={styles.constructionIcon}>🏗️</div>
          <h2 className={styles.constructionTitle}>Dashboard Under Construction</h2>
          <p className={styles.constructionText}>
            Your training dashboard is being built by the frontend team.
            <br />Check back soon for workout analytics, membership status, and more!
          </p>
          <div className={styles.userInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Name</span>
              <span>{user.firstName} {user.lastName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Role</span>
              <span className={styles.roleBadge}>{user.role}</span>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={() => setIsScannerOpen(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffcc00',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(255, 204, 0, 0.4)'
              }}
            >
              📷 Test the QR Feature
            </button>
          </div>

          {user.role === 'Admin' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => navigate('/admin/members')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffcc00', // using a yellowish color similar to the theme
                  color: '#000',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Go to Admin Panel
              </button>
            </div>
          )}
        </div>
      </main>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
      />
    </div>
  );
}
