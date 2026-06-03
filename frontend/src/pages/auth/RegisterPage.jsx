import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import styles from './Auth.module.css';
import { registerUser } from '../../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live password validation rules
  const rules = useMemo(() => ({
    hasLength:  password.length >= 8,
    hasUpper:   /[A-Z]/.test(password),
    hasNumber:  /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }), [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      });

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
      <h1 className={styles.heading}>Join Kabakal Gym</h1>
      <p className={styles.subheading}>Create your account.</p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className={styles.requirementsBox} style={{ borderColor: '#ff4444', marginBottom: '1.5rem' }}>
            <div className={styles.requirementsTitle} style={{ color: '#ff4444' }}>⚠️ {error}</div>
          </div>
        )}

        <div className={styles.rowGroup}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.label}>First Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Ronnie"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Last Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Coleman"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

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

        <div className={styles.formGroup}>
          <label className={styles.label}>Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className={`${styles.input} ${passwordsMatch ? styles.inputPass : ''} ${passwordsDontMatch ? styles.inputFail : ''}`}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordsMatch && (
            <span className={styles.inlineHint} style={{ color: '#4ade80' }}>✓ Passwords match</span>
          )}
          {passwordsDontMatch && (
            <span className={styles.inlineHint} style={{ color: '#f87171' }}>✗ Passwords don't match</span>
          )}
        </div>

        {/* Live Password Requirements */}
        {password.length > 0 && (
          <div className={styles.requirementsBox}>
            <div className={styles.requirementsTitle}>Password requirements:</div>
            <ul className={styles.requirementsList}>
              <li className={rules.hasLength ? styles.rulePass : styles.ruleFail}>
                <span>{rules.hasLength ? '✓' : '✗'}</span> At least 8 characters
              </li>
              <li className={rules.hasUpper ? styles.rulePass : styles.ruleFail}>
                <span>{rules.hasUpper ? '✓' : '✗'}</span> One uppercase letter (A-Z)
              </li>
              <li className={rules.hasNumber ? styles.rulePass : styles.ruleFail}>
                <span>{rules.hasNumber ? '✓' : '✗'}</span> One number (0-9)
              </li>
              <li className={rules.hasSpecial ? styles.rulePass : styles.ruleFail}>
                <span>{rules.hasSpecial ? '✓' : '✗'}</span> One special character (!@#$%)
              </li>
            </ul>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <p className={styles.switchMode}>
          Already a member?
          <Link to="/login" className={styles.switchLink}>Switch Mode</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
