import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styles from './MemberLayout.module.css';

const MemberLayout = () => {
  return (
    <div className={styles.appContainer}>
      
      {/* Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <nav className={styles.navBar}>
        
        {/* Desktop Header */}
        <div className={styles.navHeaderDesktop}>
          <h2 className={styles.sidebarTitle}>Member Panel</h2>
          <p className={styles.sidebarSubtitle}>Kabakal Gym</p>
        </div>

        <div className={styles.navLinksContainer}>
          <NavLink 
            to="/member/dashboard" 
            className={({ isActive }) => isActive ? `${styles.navItems} ${styles.active}` : styles.navItems}
          >
            <img src="/assets/Home_Icon.png" alt="Home" className={styles.navIcon} />
            <span className={styles.iconLabel}>HOME</span>
          </NavLink>

          <NavLink 
            to="/member/calendar" 
            className={({ isActive }) => isActive ? `${styles.navItems} ${styles.active}` : styles.navItems}
          >
            <img src="/assets/Calendar_Icon.png" alt="Calendar" className={styles.navIcon} />
            <span className={styles.iconLabel}>CALENDAR</span>
          </NavLink>

          <img className={styles.navLogoBadge} src="/assets/monogram-logo.png" alt="Kabakal Gym Logo" />

          <NavLink 
            to="/member/billing" 
            className={({ isActive }) => isActive ? `${styles.navItems} ${styles.active}` : styles.navItems}
          >
            <img src="/assets/Payment_Icon.png" alt="Billing" className={styles.navIcon} />
            <span className={styles.iconLabel}>BILLING</span>
          </NavLink>

          <NavLink 
            to="/member/profile" 
            className={({ isActive }) => isActive ? `${styles.navItems} ${styles.active}` : styles.navItems}
          >
            <img src="/assets/Profile_Icon.png" alt="Profile" className={styles.navIcon} />
            <span className={styles.iconLabel}>PROFILE</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content Rendered Here */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

    </div>
  );
};

export default MemberLayout;
