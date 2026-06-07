import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, RefreshCw, Smartphone, MapPin, DollarSign, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getQrPayload } from '../../services/api';
import styles from './GateKioskPage.module.css';

export default function GateKioskPage() {
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(300);
  const navigate = useNavigate();

  const fetchPayload = async () => {
    try {
      const data = await getQrPayload();
      setPayload(data.payload);
      setError('');
      setCountdown(300); // 5 minutes
    } catch (err) {
      console.error(err);
      setError('Failed to fetch QR code. Retrying...');
    }
  };

  useEffect(() => {
    fetchPayload();
    // Fetch new payload every 5 minutes (300000 ms)
    const intervalId = setInterval(fetchPayload, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    localStorage.removeItem('kabakal_user');
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={styles.kioskContainer}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <span className={styles.logoText}>KC</span>
          <h2>Kabakal Gym</h2>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} /> Exit Kiosk
        </button>
      </nav>

      <main className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.brandingHeader}>
            <h1>Gym Access</h1>
            <p>Scan to instantly check-in or request a Day Pass.</p>
          </div>

          <div className={styles.qrCard}>
            {error ? (
              <div className={styles.errorBox}>
                <ShieldAlert size={48} color="#ff4444" />
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className={styles.qrWrapper}>
                  {payload ? (
                    <QRCodeSVG
                      value={payload}
                      size={320}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                      includeMargin={true}
                    />
                  ) : (
                    <div className={styles.loadingBox}>
                      <RefreshCw className={styles.spinner} size={48} />
                      <p>Generating...</p>
                    </div>
                  )}
                </div>
                <div className={styles.timerBox}>
                  <p>Secure code refreshes in <strong>{formatTime(countdown)}</strong></p>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${(countdown / 300) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.instructionsPanel}>
            <h3>How to use</h3>
            <div className={styles.stepList}>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><Smartphone size={24} /></div>
                <div className={styles.stepText}>
                  <h4>Open Dashboard</h4>
                  <p>Log in to your Kabakal Gym account on your phone.</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><MapPin size={24} /></div>
                <div className={styles.stepText}>
                  <h4>Enable Location</h4>
                  <p>Ensure your GPS is on. You must be at the gym to scan.</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><RefreshCw size={24} /></div>
                <div className={styles.stepText}>
                  <h4>Scan QR Code</h4>
                  <p>Tap the yellow scan button and point it at this screen.</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}><DollarSign size={24} /></div>
                <div className={styles.stepText}>
                  <h4>Walk-ins</h4>
                  <p>No active sub? Scan anyway, then pay ₱50 at the front desk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
