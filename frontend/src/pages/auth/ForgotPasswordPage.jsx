import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { forgotPassword } from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Reset Password</h1>
      <p className={styles.subheading}>
        Enter your email and we'll send you a reset link.
      </p>

      {submitted ? (
        <div className={styles.requirementsBox}>
          <div className={styles.requirementsTitle}>📧 Check your inbox!</div>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
            If an account with <strong>{email}</strong> exists, a password reset link has been sent.
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
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className={styles.switchMode}>
        Remember your password?
        <Link to="/login" className={styles.switchLink}>Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
