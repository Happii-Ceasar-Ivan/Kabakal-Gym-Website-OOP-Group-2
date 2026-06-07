import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { getQrPayload } from '../../services/api';
import styles from './GateKioskPage.module.css';

export default function GateKioskPage() {
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(300);

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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={styles.kioskContainer}>
      <div className={styles.branding}>
        <h1>KABAKAL GYM</h1>
        <p>Scan to Check-In or Day Pass Walk-in</p>
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
                  size={400}
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
              <p>Code refreshes in <strong>{formatTime(countdown)}</strong></p>
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

      <div className={styles.instructions}>
        <h2>Instructions</h2>
        <ol>
          <li>Open the Kabakal Gym Member Dashboard on your phone.</li>
          <li>Click the <strong>"Scan Kiosk QR"</strong> button.</li>
          <li>Ensure Location Services (GPS) is turned on.</li>
          <li>Walk-ins: Proceed to Staff desk to pay ₱50.</li>
        </ol>
      </div>
    </div>
  );
}
