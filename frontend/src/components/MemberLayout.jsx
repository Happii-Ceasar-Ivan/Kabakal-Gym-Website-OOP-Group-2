import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styles from './MemberLayout.module.css';

// Import newly copied assets
import homeIcon from '../assets/member-icons/Home_Icon.png';
import calendarIcon from '../assets/member-icons/Calendar_Icon.png';
import paymentIcon from '../assets/member-icons/Payment_Icon.png';
import profileIcon from '../assets/member-icons/Profile_Icon.png';
import kabakalLogo from '../assets/member-icons/monogram-logo.png';

const MemberLayout = () => {
    return (
        <div className={styles.mainContent}>
            {/* The child page (Dashboard, Calendar, etc.) will render here */}
            <Outlet />

            {/* Bottom Navigation Bar */}
            <nav className={styles.bottomNavBar}>
                <NavLink 
                    to="/member/dashboard" 
                    className={({ isActive }) => `${styles.navItems} ${isActive ? styles.active : ''}`}
                >
                    <img src={homeIcon} alt="Home" className={styles.icon} />
                    <span className={styles.iconLabel}>HOME</span>
                </NavLink>

                <NavLink 
                    to="/member/calendar" 
                    className={({ isActive }) => `${styles.navItems} ${isActive ? styles.active : ''}`}
                >
                    <img src={calendarIcon} alt="Calendar" className={styles.icon} />
                    <span className={styles.iconLabel}>CALENDAR</span>
                </NavLink>

                <img className={styles.navLogoBadge} src={kabakalLogo} alt="Kabakal Gym Logo" />

                <NavLink 
                    to="/member/billing" 
                    className={({ isActive }) => `${styles.navItems} ${isActive ? styles.active : ''}`}
                >
                    <img src={paymentIcon} alt="Billing" className={styles.icon} />
                    <span className={styles.iconLabel}>BILLING</span>
                </NavLink>

                <NavLink 
                    to="/member/profile" 
                    className={({ isActive }) => `${styles.navItems} ${isActive ? styles.active : ''}`}
                >
                    <img src={profileIcon} alt="Profile" className={styles.icon} />
                    <span className={styles.iconLabel}>PROFILE</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default MemberLayout;
