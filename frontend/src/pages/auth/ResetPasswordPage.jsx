import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { resetPassword } from '../../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword({
        token,
        newPassword,
        confirmNewPassword: confirmPassword
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <h1 className={styles.heading}>Invalid Link</h1>
        <p className={styles.subheading}>
          This password reset link is invalid or has expired.
        </p>
        <Link to="/forgot-password" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center' }}>
          Request New Link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Set New Password</h1>
      <p className={styles.subheading}>Enter your new password below.</p>

      {submitted ? (
        <div className={styles.requirementsBox}>
          <div className={styles.requirementsTitle}>✅ Password Updated!</div>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link to="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className={styles.requirementsBox} style={{ borderColor: '#ff4444' }}>
              <div className={styles.requirementsTitle} style={{ color: '#ff4444' }}>⚠️ {error}</div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                className={styles.input}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              className={styles.input}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className={styles.requirementsBox}>
            <div className={styles.requirementsTitle}>Password must contain:</div>
            <ul className={styles.requirementsList}>
              <li>At least 6 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One number (0-9)</li>
              <li>One special character (e.g., !@#$%)</li>
            </ul>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <p className={styles.switchMode}>
            Changed your mind?
            <Link to="/login" className={styles.switchLink}>Back to Login</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
