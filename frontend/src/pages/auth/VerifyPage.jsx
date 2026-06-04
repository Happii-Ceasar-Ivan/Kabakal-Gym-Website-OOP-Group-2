import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { verifyEmail } from '../../services/api';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      }
    };

    verify();
  }, [token]);

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center' }}>
        <h1 className={styles.title}>Email Verification</h1>

        {status === 'verifying' && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Verifying your email address, please wait...
          </p>
        )}

        {status === 'success' && (
          <>
            <div style={{ color: '#4caf50', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {message}
            </p>
            <Link to="/login" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
              GO TO LOGIN
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ color: '#f44336', fontSize: '3rem', marginBottom: '1rem' }}>⚠</div>
            <p style={{ color: '#f44336', marginBottom: '2rem' }}>
              {message}
            </p>
            <Link to="/register" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-block', background: 'transparent', border: '1px solid var(--accent-yellow)', color: 'var(--accent-yellow)' }}>
              BACK TO REGISTER
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
