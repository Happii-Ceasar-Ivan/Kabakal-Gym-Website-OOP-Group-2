import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMember } from '../../services/api';
import styles from './MemberCalendar.module.css';

const MemberCalendarPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Temporary hardcoded dates for UI
  const days = ['MON, 18', 'TUE, 19', 'WED, 20'];
  const [activeDay, setActiveDay] = useState('TUE, 19');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('kabakal_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
      
      const data = await getMember(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile for calendar', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{color: '#f7f014', textAlign: 'center', marginTop: '50px'}}>Loading schedule...</div>;
  }

  // Check subscription status
  const activeSub = profile?.subscriptions?.find(s => s.status === 'Active' && new Date(s.endDate) > new Date());
  
  // Calculate if expiring within 3 days
  let isExpiringSoon = false;
  let isExpired = false;
  if (activeSub) {
      const endDate = new Date(activeSub.endDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) isExpiringSoon = true;
  } else {
      isExpired = true;
  }

  return (
    <div className={styles.calendarContainer}>
      <h3 className={styles.tabsTitle}>HERE'S YOUR SCHEDULE, {profile?.firstName?.toUpperCase()}!</h3>
      <h4 className={styles.calendarMonth}>
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
      </h4>

      <div className={styles.dateSelector}>
          <button className={styles.navArrow}>&lt;</button>
          {days.map(day => (
            <button 
              key={day}
              className={`${styles.dateItem} ${activeDay === day ? styles.active : ''}`}
              onClick={() => setActiveDay(day)}
            >
              {day}
            </button>
          ))}
          <button className={styles.navArrow}>&gt;</button>
      </div>

      {/* Gate Log Section */}
      <section className={styles.logSection}>
          <div className={styles.sectionText}><h4>GATE LOG</h4></div>
          <div className={styles.logCard}>
              <div className={styles.logHeader}>
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                  <span className={styles.statusBadge}>Verified Logged-In via QR CODE</span>
              </div>
              {/* In a real scenario, this would map over profile.visits */}
              <div className={styles.logTimes}>CHECK-IN: 06:17 PM | CHECK-OUT: 08:08 PM</div>
          </div>
      </section>

      {/* Today's Session Section (AI Workout) */}
      <section className={styles.sessionSection}>
          <div className={styles.sectionText}><h4>TODAY'S SESSION (AI GENERATED)</h4></div>
          <div className={styles.logCard}>
              <div className={styles.sessionItem}>
                  <span className={styles.sessionNumber}>01</span>
                  <div className={styles.sessionInfo}>
                      <strong>WARMUP</strong><br/>Dynamic Stretching | 10 mins
                  </div>
              </div>
              <div style={{ borderBottom: '1px solid #f7f014', margin: '10px 0' }}></div>
              <div className={styles.sessionItem}>
                  <span className={styles.sessionNumber}>02</span>
                  <div className={styles.sessionInfo}>
                      <strong>BENCH PRESS</strong><br/>4 Sets, 10 Reps | Rest: 60s
                  </div>
              </div>
              <div style={{ borderBottom: '1px solid #f7f014', margin: '10px 0' }}></div>
              <div className={styles.sessionItem}>
                  <span className={styles.sessionNumber}>03</span>
                  <div className={styles.sessionInfo}>
                      <strong>INCLINE DUMBBELL PRESS</strong><br/>3 Sets, 12 Reps | Rest: 60s
                  </div>
              </div>
          </div>
      </section>

      {/* Subscription Alert Section */}
      {(isExpiringSoon || isExpired) && (
        <section className={styles.alertSection}>
            <div className={styles.alertContainer}>
                <p>DUE DATE ALERT ⚠️<br/>
                  {isExpired ? 'Your Membership Pass Has Expired' : 'Your Membership Pass Expires Soon'}
                </p>
                <button 
                  type="button" 
                  className={styles.ctaButton}
                  onClick={() => navigate('/member/billing')}
                >
                  TAP TO PAY SUBSCRIPTION
                </button>
            </div>
        </section>
      )}

    </div>
  );
};

export default MemberCalendarPage;
