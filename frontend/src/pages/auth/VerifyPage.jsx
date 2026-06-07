import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { verifyEmail } from '../../services/api';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyEmail(email, otp);
      setSuccess(true);
      // Give them a moment to read the success message
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Verify Your Email</h1>
      <p className={styles.subheading}>Enter the 6-digit code we sent to your inbox.</p>

      {success ? (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ color: '#4caf50', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Email verified successfully! Redirecting to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className={styles.requirementsBox} style={{ borderColor: '#ff4444', marginBottom: '1.5rem' }}>
              <div className={styles.requirementsTitle} style={{ color: '#ff4444' }}>⚠️ {error}</div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gains@kabakal.gym"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>6-Digit Verification Code</label>
            <input
              type="text"
              className={styles.input}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength="6"
              pattern="\d{6}"
              title="Please enter a 6-digit code"
              style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem', padding: '1rem' }}
              required
              autoFocus
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading || otp.length !== 6 || !email}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <p className={styles.switchMode} style={{ marginTop: '1.5rem' }}>
            Back to <Link to="/register">Registration</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
