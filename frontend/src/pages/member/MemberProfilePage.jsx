import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateProfilePicture } from '../../services/api';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import styles from './MemberProfile.module.css';

const MemberProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { upload, uploading, error: uploadError } = useCloudinaryUpload();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile();
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const cloudinaryUrl = await upload(file);
      if (cloudinaryUrl) {
        // Save to database
        await updateProfilePicture(cloudinaryUrl);
        // Update local state to reflect new image instantly
        setProfile(prev => ({ ...prev, profilePictureUrl: cloudinaryUrl }));
      }
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture.');
    }
  };

  if (loading) {
    return <div style={{ color: '#f7f014', textAlign: 'center', marginTop: '50px' }}>Loading profile...</div>;
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

        <label className={styles.avatarWrapper} style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          <div className={styles.avatarCircle} style={{ opacity: uploading ? 0.5 : 1 }}>
            {uploading ? (
              <div style={{ color: '#f7f014', fontSize: '12px' }}>Uploading...</div>
            ) : (
              <img 
                src={profile?.profilePictureUrl || "/assets/placeholderforpfp.png"} 
                alt="Avatar" 
                className={styles.avatarIcon} 
                style={profile?.profilePictureUrl ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' } : {}}
              />
            )}
          </div>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            style={{ display: 'none' }} 
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </label>

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
