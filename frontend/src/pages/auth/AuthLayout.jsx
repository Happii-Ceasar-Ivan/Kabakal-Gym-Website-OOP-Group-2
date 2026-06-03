import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

// You can use a generic gym interior image or import one from assets if available
const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop';

export default function AuthLayout({ children }) {
  return (
    <div className={styles.authPage}>
      {/* Background Layer */}
      <img src={BG_IMAGE_URL} alt="Gym Background" className={styles.bgImage} />
      
      {/* Form Container Layer */}
      <div className={styles.authContainer}>
        <Link to="/" className={styles.backLink}>
          ← Back to Home
        </Link>
        {children}
      </div>
    </div>
  );
}
