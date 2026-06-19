import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberCalendar.module.css';

const MemberCalendarPage = () => {
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

    // Get current month and year dynamically
    const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className={styles.pageContainer}>
            <h3 className={styles.tabsTitle}>HERE'S YOUR SCHEDULE, {user.firstName.toUpperCase()}!</h3>
            <h4 className={styles.calendarMonth}>{currentMonthYear}</h4>

            {/* Date Selector */}
            <div className={styles.dateSelector}>
                <button className={styles.navArrow}>&lt;</button>
                <button className={styles.dateItem}>MON, 18</button>
                <button className={`${styles.dateItem} ${styles.active}`}>TUE, 19</button>
                <button className={styles.dateItem}>WED, 20</button>
                <button className={styles.navArrow}>&gt;</button>
            </div>

            {/* Gate Log Section */}
            <section style={{ width: '340px' }}>
                <div className={styles.sectionText}><h4>GATE LOG</h4></div>
                <div className={styles.logCard}>
                    <div className={styles.logHeader}>
                        <span>TUE, MAY 19, 2026</span>
                        <span className={styles.statusBadge}>Verified Logged-In via QR CODE</span>
                    </div>
                    <div className={styles.logTimes}>CHECK-IN: 06:17 PM | CHECK-OUT: 08:08 PM</div>
                </div>
            </section>

            {/* Today's Session Section */}
            <section style={{ width: '340px' }}>
                <div className={styles.sectionText}><h4>TODAY'S SESSION</h4></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.sessionItem}>
                        <span className={styles.sessionNumber}>01</span>
                        <div className={styles.sessionInfo}>
                            <strong>6:00 PM - 7:00 PM</strong><br />BENCH PRESS | 4 Sets, 10 Reps | 5 Slots Left
                        </div>
                    </div>
                    <div className={styles.sessionItem}>
                        <span className={styles.sessionNumber}>02</span>
                        <div className={styles.sessionInfo}>
                            <strong>7:00 PM - 8:00 PM</strong><br />INCLINE DUMBELL PRESS | 3 Sets, 12 Reps | FULL
                        </div>
                    </div>
                </div>
            </section>

            {/* Alert Section */}
            <section style={{ width: '340px' }}>
                <div className={styles.alertContainer}>
                    <p>DUE DATE ALERT ⚠️<br />Your Membership Pass Expires Tomorrow</p>
                    <button type="button" className={styles.ctaButton} onClick={() => navigate('/member/billing')}>TAP TO PAY SUBSCRIPTION</button>
                </div>
            </section>
        </div>
    );
};

export default MemberCalendarPage;
