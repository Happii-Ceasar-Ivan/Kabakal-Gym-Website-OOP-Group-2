import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberDashboard.module.css';

const MemberDashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('kabakal_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return null;

    const initials = (user.firstName?.[0] || 'G') + (user.lastName?.[0] || 'M');

    return (
        <div className={styles.pageContainer}>
            {/* Header: Profile and Welcome Text */}
            <header className={styles.homeHeader}>
                <div>
                    <h1>WELCOME, {user.firstName.toUpperCase()}!</h1>
                    <p>To Kabakal Gym, where your routines, your records, and your community—all in one place.</p>
                </div>
                <div className={styles.profileIcon} onClick={() => navigate('/member/profile')} style={{ cursor: 'pointer' }}>
                    {initials}
                </div>
            </header>

            {/* Search Bar */}
            <input type="search" placeholder="🔍 Browse" className={styles.searchBar} />

            {/* Stats Grid */}
            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span>4</span>
                    Sessions
                </div>
                <div className={styles.statCard}>
                    <span>7</span>
                    Day Streak
                </div>
                <div className={styles.statCard}>
                    <span>6 PM</span>
                    Session
                </div>
            </section>

            {/* Ad or Promo Placeholder */}
            <section className={styles.adPlaceholder}>
                <p>PLACEHOLDER SPACE</p>
            </section>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <button className={styles.btn} onClick={() => navigate('/member/workout-generator')}>GENERATED WORKOUT</button>
                <button className={styles.btn}>VIEW NEW ROUTINES</button>
                <button className={styles.btn}>SCAN QR-CODE</button>
                <button className={styles.btn}>TIMER</button>
            </section>
        </div>
    );
};

export default MemberDashboardPage;
