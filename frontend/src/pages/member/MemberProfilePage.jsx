import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMember } from '../../services/api';
import styles from './MemberProfile.module.css';

const MemberProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Decode JWT to get UserId
      const token = localStorage.getItem('kabakal_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      // The name identifier claim is usually user_id or sub
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
      
      const data = await getMember(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    localStorage.removeItem('kabakal_user');
    navigate('/login');
  };

  if (loading) {
    return <div style={{color: '#f7f014', textAlign: 'center', marginTop: '50px'}}>Loading profile...</div>;
  }

  // Determine active subscription tier
  const activeSub = profile?.subscriptions?.find(s => s.status === 'Active' && new Date(s.endDate) > new Date());
  const tier = activeSub ? activeSub.plan.name : 'Basic';
  const status = activeSub ? 'ACTIVE' : 'INACTIVE';
  const shortId = profile?.userId?.split('-')[0].toUpperCase() || 'UNKNOWN';

  return (
    <div className={styles.profileContainer}>
      
      <div className={styles.headerBackground}>
        <div className={styles.headerArrowContainer}>
           {/* Temporary back arrow placeholder if needed */}
        </div>
        
        <div className={styles.avatarWrapper}>
            <div className={styles.avatarCircle}>
                <img src="/assets/monogram-logo.png" alt="Avatar" className={styles.avatarIcon} />
            </div>
        </div>
        
        <div className={styles.profileName}>
          {profile?.firstName} {profile?.lastName}
        </div>
        <div className={styles.profileSubtextQuote}>
          "Embrace the struggle."
        </div>
      </div>

      <div className={styles.settingContent}>
          
          <div className={styles.settingGroup}>
              <div className={styles.settingGroupTitle}>MEMBER PROFILE</div>
              <div className={styles.settingGroupBody}>
                  <div className={styles.infoRow}>
                      <span className={styles.label}>MEMBER ID:</span>
                      <span className={`${styles.value} ${styles.asterisks}`}>{shortId}</span>
                  </div>
                  <div className={`${styles.infoRow} ${styles.inlineRow}`}>
                      <span className={styles.label}>TIER:</span>
                      <span className={styles.value}>{tier}</span>
                      <span className={styles.divider}>|</span>
                      <span className={styles.label}>STATUS:</span>
                      <span className={styles.statusBadge} style={{ backgroundColor: status === 'ACTIVE' ? '#228B22' : '#8B0000' }}>
                        {status}
                      </span>
                  </div>
              </div>
          </div>

          <div className={styles.settingGroup}>
              <div className={styles.settingGroupTitle}>ACCOUNT SETTINGS</div>
              <div className={styles.settingGroupBody}>
                  <div className={styles.menuList}>
                      <div className={styles.menuItem}>Edit Personal Information</div>
                      <div className={styles.menuItem}>Change Password</div>
                      <div className={styles.menuItem}>Manage Payment Methods</div>
                      <div className={styles.menuItem}>Notification Preferences</div>
                  </div>
              </div>
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>

      </div>
    </div>
  );
};

export default MemberProfilePage;
