import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  const [agreedToTos, setAgreedToTos] = useState(false);
  const [showTos, setShowTos] = useState(false);

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

        {/* Terms of Service Checkbox */}
        <div className={styles.tosGroup}>
          <label className={styles.tosLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreedToTos}
              onChange={(e) => setAgreedToTos(e.target.checked)}
            />
            By registering you ACCEPT the{' '}
            <button
              type="button"
              className={styles.tosLink}
              onClick={() => setShowTos(true)}
            >
              Terms of Service
            </button>
          </label>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading || !agreedToTos}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        {/* TOS Modal */}
        {showTos && createPortal(
          <div className={styles.modalOverlay} onClick={() => setShowTos(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Terms of Service</h2>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setShowTos(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <h3>1. Acceptance of Terms</h3>
                <p>By creating an account and using Kabakal Gym's services (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, do not register.</p>

                <h3>2. Account Registration</h3>
                <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>

                <h3>3. Privacy & Data Collection</h3>
                <p>We collect personal information (name, email, payment history) solely to operate the Service. We do not sell your data to third parties. Your data is stored securely using industry-standard encryption. For full details, refer to our Privacy Policy.</p>

                <h3>4. Membership & Payments</h3>
                <p>Membership fees are non-refundable unless otherwise stated. Kabakal Gym reserves the right to change pricing with 30 days' prior notice to active subscribers.</p>

                <h3>5. User Conduct</h3>
                <p>You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, distributing malware, or harassing other users.</p>

                <h3>6. Assumption of Risk</h3>
                <p>Physical exercise involves inherent risks. By using Kabakal Gym's facilities, you acknowledge and accept these risks. Kabakal Gym is not liable for injuries sustained during workouts.</p>

                <h3>7. Limitation of Liability</h3>
                <p>Kabakal Gym shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including data loss or service interruptions.</p>

                <h3>8. Termination</h3>
                <p>Kabakal Gym reserves the right to suspend or terminate your account at any time for violation of these terms, without prior notice.</p>

                <h3>9. Changes to Terms</h3>
                <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

                <h3>10. Contact</h3>
                <p>For questions regarding these Terms, contact us at support@kabakalgym.com or visit us at 47 Kalayaan B, Batasan Hills, Quezon City.</p>

                <p style={{ marginTop: '1.5rem', opacity: 0.5, fontSize: '0.8rem' }}>Last updated: June 2026</p>
              </div>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={() => setShowTos(false)}
                style={{ marginTop: '1rem' }}
              >
                I Understand
              </button>
            </div>
          </div>,
          document.body
        )}

        <p className={styles.switchMode}>
          Already a member?
          <Link to="/login" className={styles.switchLink}>Switch Mode</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
