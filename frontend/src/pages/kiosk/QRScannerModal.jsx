import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { verifyCheckIn } from '../../services/api';
import styles from './QRScannerModal.module.css';

export default function QRScannerModal({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle'); // idle, scanning, processing, success, error
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setMessage('');
      return;
    }

    let html5QrcodeScanner = null;

    const onScanSuccess = async (decodedText) => {
      // Pause scanning
      html5QrcodeScanner.pause();
      setStatus('processing');
      setMessage('Wait checking you in...');

      try {
        // 1. Get GPS coordinates
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // 2. Call backend
              const response = await verifyCheckIn(decodedText, latitude, longitude);
              setStatus('success');
              setMessage(response.message || 'Check-in successful!');
              html5QrcodeScanner.clear();
            } catch (err) {
              setStatus('error');
              setMessage(err.message || 'Failed to verify check-in.');
              // Resume scanning so they can try again
              setTimeout(() => {
                setStatus('scanning');
                setMessage('');
                html5QrcodeScanner.resume();
              }, 3000);
            }
          },
          (error) => {
            console.error("GPS Error:", error);
            setStatus('error');
            setMessage('Failed to get your location. GPS is required to check in.');
            setTimeout(() => {
              setStatus('scanning');
              setMessage('');
              html5QrcodeScanner.resume();
            }, 4000);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } catch (err) {
        console.error(err);
      }
    };

    const onScanFailure = (error) => {
      // Handle silently as it fires continuously when no QR is detected
    };

    // Initialize scanner
    setStatus('scanning');
    html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Cleanup
    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2>Check-In Scanner</h2>
        <p className={styles.subtitle}>
          <MapPin size={16} /> GPS location will be verified.
        </p>

        {status === 'processing' && (
          <div className={styles.statusBox}>
            <div className={styles.spinner}></div>
            <p>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.statusBox} style={{ color: '#4caf50' }}>
            <CheckCircle size={48} />
            <p>{message}</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.errorBox}>
            <AlertTriangle size={32} />
            <p>{message}</p>
          </div>
        )}

        <div 
          id="qr-reader" 
          className={styles.reader} 
          style={{ display: status === 'scanning' || status === 'error' ? 'block' : 'none' }}
        ></div>
      </div>
    </div>
  );
}
