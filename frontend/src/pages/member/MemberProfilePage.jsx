import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.css';

const MemberProfilePage = () => {
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

    const handleLogout = () => {
        localStorage.removeItem('kabakal_token');
        localStorage.removeItem('kabakal_user');
        navigate('/login');
    };

    if (!user) return null;

    // We can pull the first letter of first name to create a default avatar
    const initials = (user.firstName?.[0] || 'G') + (user.lastName?.[0] || 'M');

    return (
        <div className={styles.profileContainer}>
            <div className={styles.headerBackground}>
                {/* Back button removed as it's the root profile tab */}
                
                <div className={styles.avatarWrapper}>
                    <div className={styles.avatarCircle}>
                        <div className={styles.avatarIcon} style={{
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            fontSize: '36px',
                            fontWeight: 'bold',
                            fontFamily: 'Archive, sans-serif',
                            color: '#111'
                        }}>
                            {initials}
                        </div>
                    </div>
                    <div className={styles.cameraBadge}>
                        <i className={styles.cameraIcon}>📷</i>
                    </div>
                </div>
                
                <div className={styles.profileName}>{user.firstName} {user.lastName}</div>
                <div className={styles.profileSubtextQuote}>"Embrace the struggle."</div>
            </div>

            <div className={styles.settingContent}>
                
                <div className={styles.settingGroup}>
                    <div className={styles.settingGroupTitle}>MEMBER PROFILE</div>
                    <div className={styles.settingGroupBody}>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>MEMBER ID:</span>
                            <span className={`${styles.value} ${styles.asterisks}`}>
                                {user.userId?.split('-')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className={`${styles.infoRow} ${styles.inlineRow}`}>
                            <span className={styles.label}>TIER:</span>
                            <span className={styles.value}>Basic</span>
                            <span className={styles.divider}>|</span>
                            <span className={styles.label}>STATUS:</span>
                            <span className={styles.statusBadge}>ACTIVE</span>
                        </div>
                    </div>
                </div>

                <div className={styles.settingGroup}>
                    <div className={styles.settingGroupTitle}>ACCOUNT SETTINGS</div>
                    <div className={styles.settingGroupBody}>
                        <div className={styles.menuList}>
                            <div className={styles.menuItem}>Edit Personal Information</div>
                            <div className={styles.menuItem}>Change Password</div>
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
