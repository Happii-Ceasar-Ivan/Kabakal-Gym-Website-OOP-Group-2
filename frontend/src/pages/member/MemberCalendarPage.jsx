import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getCalendarData } from '../../services/api';
import styles from './MemberCalendar.module.css';

// Helper to format Date as YYYY-MM-DD in local time (avoids UTC offset bugs)
const getLocalDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const MemberCalendarPage = () => {
  const [profile, setProfile] = useState(null);
  const [calendarData, setCalendarData] = useState({ visits: [], routine: null });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Active Date Management (Center window on Today initially)
  const [activeDate, setActiveDate] = useState(new Date());
  
  // We compute a 7-day window centered on the activeDate
  const windowDays = [];
  for(let i = -3; i <= 3; i++) {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + i);
    windowDays.push(d);
  }

  useEffect(() => {
    fetchData();
  }, [activeDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, calData] = await Promise.all([
        getMyProfile(),
        getCalendarData(getLocalDateString(activeDate))
      ]);
      setProfile(profileData);
      setCalendarData(calData);
    } catch (err) {
      console.error('Failed to load data for calendar', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return <div style={{color: '#888', textAlign: 'center', marginTop: '50px', fontSize: '13px', fontWeight: '600'}}>Loading schedule...</div>;
  }

  // Check subscription status
  const activeSub = profile?.paymentStatus === 'Paid' && profile?.isExpired === false;
  let isExpiringSoon = false;
  let isExpired = !activeSub;
  
  if (activeSub && profile?.expirationDate) {
      const endDate = new Date(profile.expirationDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) isExpiringSoon = true;
  }

  const handlePrevDay = () => {
    const prev = new Date(activeDate);
    prev.setDate(prev.getDate() - 1);
    setActiveDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(activeDate);
    next.setDate(next.getDate() + 1);
    setActiveDate(next);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.headerContainer}>
        <h3 className={styles.tabsTitle}>Schedule: {profile?.firstName || 'User'}</h3>
        <h4 className={styles.calendarMonth}>
          {activeDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h4>
      </div>

      <div className={styles.dateSelector}>
          <button className={styles.navArrow} onClick={handlePrevDay}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          {windowDays.map((d, i) => {
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            const isActive = getLocalDateString(d) === getLocalDateString(activeDate);
            return (
              <button 
                key={i}
                className={`${styles.dateItem} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveDate(d)}
              >
                {dayLabel}
              </button>
            );
          })}
          <button className={styles.navArrow} onClick={handleNextDay}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          {/* Gate Log Section */}
          <section className={styles.logSection}>
              <div className={styles.sectionText}><h4>Gate Log</h4></div>
              {calendarData.visits && calendarData.visits.length > 0 ? (
                calendarData.visits.map(visit => (
                  <div key={visit.visitId} className={styles.logCard}>
                      <div className={styles.logHeader}>
                          <span>{new Date(visit.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className={`${styles.statusBadge} ${!visit.isApproved ? styles.pending : ''}`}>
                            {visit.isApproved ? 'Verified' : 'Pending'}
                          </span>
                      </div>
                      <div className={styles.logTimes}>IN: {formatTime(visit.checkIn)} • OUT: {visit.checkOut ? formatTime(visit.checkOut) : 'ACTIVE'}</div>
                  </div>
                ))
              ) : (
                <div className={styles.logCard}>
                  <div className={styles.logTimes}>No visits logged for this day.</div>
                </div>
              )}
          </section>
        </div>

        <div className={styles.rightColumn}>
          {/* Today's Session Section (AI Workout) */}
          {calendarData.routine && (
            <section className={styles.sessionSection}>
                <div className={styles.sectionText}>
                  <h4>{getLocalDateString(activeDate) === getLocalDateString(new Date()) ? "Today's Session" : "Session"} • {calendarData.routine.dayLabel}</h4>
                </div>
                
                <div className={styles.sessionContainer}>
                  {calendarData.routine.isRestDay ? (
                     <div className={styles.sessionItem}>
                        <div className={styles.sessionInfo}>
                            <strong>Rest Day</strong>
                            {calendarData.routine.focusArea}
                        </div>
                     </div>
                  ) : (
                    calendarData.routine.exercises.map((exercise, index) => (
                      <React.Fragment key={index}>
                        <div className={styles.sessionItem}>
                            <span className={styles.sessionNumber}>{(index + 1).toString().padStart(2, '0')}</span>
                            <div className={styles.sessionInfo}>
                                <strong>{exercise.exerciseName}</strong>
                                {exercise.sets} Sets × {exercise.reps} Reps • {exercise.startingWeight}
                            </div>
                        </div>
                        {index < calendarData.routine.exercises.length - 1 && (
                          <div className={styles.sessionDivider}></div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
            </section>
          )}

          {/* Subscription Alert Section */}
          {(isExpiringSoon || isExpired) && (
            <section className={styles.alertSection}>
                <div className={styles.alertContainer}>
                    <p>
                      <strong>Due Date Alert</strong>
                      {isExpired ? 'Your Membership Pass Has Expired.' : 'Your Membership Pass Expires Soon.'}
                    </p>
                    <button 
                      type="button" 
                      className={styles.ctaButton}
                      onClick={() => navigate('/member/billing')}
                    >
                      Pay Subscription
                    </button>
                </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCalendarPage;
