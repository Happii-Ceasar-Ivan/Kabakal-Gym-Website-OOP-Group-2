import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { loginUser } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      // Store JWT and user info in localStorage
      localStorage.setItem('kabakal_token', data.token);
      localStorage.setItem('kabakal_user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      }));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className={styles.heading}>Member Login</h1>
      <p className={styles.subheading}>Unlock your training dashboard.</p>

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
            placeholder="gains@kabakal.gym"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <div className={styles.optionsRow}>
          <label className={styles.checkboxGroup}>
            <input type="checkbox" className={styles.checkbox} />
            <span>Remember me for 30 days</span>
          </label>
          <Link to="/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Authenticating...' : 'Authenticate'}
        </button>

        <p className={styles.switchMode}>
          New to Kabakal Gym?
          <Link to="/register" className={styles.switchLink}>Switch Mode</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
