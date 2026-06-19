import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateProfileSettings, deleteAccount, exportAccountData } from '../../services/api';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import toast from 'react-hot-toast';
import styles from './MemberProfile.module.css';

const MemberProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cloudinary hooks
  const { upload: uploadPfp, uploading: uploadingPfp } = useCloudinaryUpload();
  const { upload: uploadBg, uploading: uploadingBg } = useCloudinaryUpload();
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Edit Form state
  const [bioInput, setBioInput] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    localStorage.removeItem('kabakal_user');
    navigate('/login');
  };

  const openEditModal = () => {
    setBioInput(profile?.bio || '');
    setShowEditModal(true);
  };

  const handlePfpUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const cloudinaryUrl = await uploadPfp(file);
      if (cloudinaryUrl) {
        await updateProfileSettings({ profilePictureUrl: cloudinaryUrl });
        setProfile(prev => ({ ...prev, profilePictureUrl: cloudinaryUrl }));
        toast.success("Profile picture updated!");
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile picture.');
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const cloudinaryUrl = await uploadBg(file);
      if (cloudinaryUrl) {
        await updateProfileSettings({ backgroundPictureUrl: cloudinaryUrl });
        setProfile(prev => ({ ...prev, backgroundPictureUrl: cloudinaryUrl }));
        toast.success("Background picture updated!");
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload background.');
    }
  };

  const saveBio = async () => {
    try {
      await updateProfileSettings({ bio: bioInput });
      setProfile(prev => ({ ...prev, bio: bioInput }));
      setShowEditModal(false);
      toast.success("Bio updated!");
    } catch (err) {
      toast.error("Failed to update bio.");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kabakal_gym_my_data.json';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch (err) {
      toast.error("Failed to export data.");
    }
  };

  const executeDelete = async (permanent) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(permanent);
      toast.success(permanent ? "Account permanently deleted." : "Account deactivated.");
      handleLogout();
    } catch (err) {
      toast.error("Failed to delete account.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#888', textAlign: 'center', marginTop: '50px', fontFamily: "'Fira Code', monospace", fontSize: '13px' }}>Loading profile...</div>;
  }

  const activeSub = profile?.subscriptions?.find(s => s.status === 'Active' && new Date(s.endDate) > new Date());
  const tier = activeSub ? activeSub.plan.name : 'Basic';
  const status = activeSub ? 'ACTIVE' : 'INACTIVE';
  
  const bgStyle = { 
    backgroundImage: `linear-gradient(to bottom, rgba(6, 4, 7, 0.2), #060407), url(${profile?.backgroundPictureUrl || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600'})` 
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.headerBackground} style={bgStyle}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarCircle}>
            <img 
              src={profile?.profilePictureUrl || "/assets/placeholderforpfp.png"} 
              alt="Avatar" 
              className={styles.avatarIcon} 
            />
          </div>
        </div>
      </div>

      <div className={styles.profileInfoWrapper}>
        <div className={styles.profileName}>
          {profile?.firstName} {profile?.lastName}
        </div>
        <div className={styles.profileSubtextQuote}>
           "{profile?.bio || 'Embrace the struggle.'}"
        </div>
      </div>

      <div className={styles.settingContent}>
        
        {/* Personal Information Group */}
        <div className={styles.settingGroup}>
          <div className={styles.settingGroupTitle}>Personal Information</div>
          <div className={styles.settingGroupBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email Address</span>
              <span className={styles.value}>{profile?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Membership Tier</span>
              <span className={styles.value}>{tier}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Account Status</span>
              <span className={`${styles.statusBadge} ${status !== 'ACTIVE' ? styles.inactive : ''}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Account Management Group */}
        <div className={styles.settingGroup}>
          <div className={styles.settingGroupTitle}>Account Management</div>
          <div className={styles.settingGroupBody} style={{ padding: '8px' }}>
            <div className={styles.menuList}>
              <div className={styles.menuItem} onClick={openEditModal}>
                <span>Edit Personal Information</span>
                <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <div className={styles.menuItem} onClick={handleExportData}>
                <span>Export My Data</span>
                <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <div className={`${styles.menuItem} ${styles.danger}`} onClick={() => setShowDeleteModal(true)}>
                <span>Delete Account</span>
                <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.logoutContainer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            LOG OUT
          </button>
        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>EDIT PROFILE</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <label className={styles.modalUploadBtn} style={{ cursor: uploadingPfp ? 'not-allowed' : 'pointer' }}>
                <span>{uploadingPfp ? 'Uploading...' : 'Update Profile Picture'}</span>
                <span>Upload</span>
                <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handlePfpUpload} disabled={uploadingPfp} />
              </label>

              <label className={styles.modalUploadBtn} style={{ cursor: uploadingBg ? 'not-allowed' : 'pointer' }}>
                <span>{uploadingBg ? 'Uploading...' : 'Update Background Banner'}</span>
                <span>Upload</span>
                <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleBgUpload} disabled={uploadingBg} />
              </label>

              <div style={{ width: '100%', marginTop: '8px' }}>
                 <label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', fontFamily: "'Archive', sans-serif", letterSpacing: '0.1em' }}>Update Bio</label>
                 <textarea 
                   className={styles.modalTextarea}
                   value={bioInput}
                   onChange={(e) => setBioInput(e.target.value)}
                   maxLength={150}
                   rows={3}
                 />
              </div>

              <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '16px' }}>
                 <button onClick={() => setShowEditModal(false)} className={styles.modalBtnSecondary}>CANCEL</button>
                 <button onClick={saveBio} className={styles.modalBtnPrimary}>SAVE CHANGES</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle} style={{ color: '#ff4444' }}>DELETE ACCOUNT</h2>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '32px', lineHeight: '1.6', fontFamily: "'Fira Code', monospace" }}>
              You are about to delete your account. Do you want to temporarily deactivate it, or permanently destroy all your personal data?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                onClick={() => executeDelete(false)}
                disabled={deleting}
                className={styles.modalBtnSecondary}
                style={{ marginBottom: '16px', color: '#fff', borderColor: '#444' }}
              >
                DEACTIVATE (Can be restored)
              </button>
              
              <button 
                onClick={() => executeDelete(true)}
                disabled={deleting}
                className={styles.modalBtnDanger}
              >
                PERMANENTLY DELETE DATA
              </button>

              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ 
                  padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#888',
                  cursor: 'pointer', marginTop: '8px', fontFamily: "'Archive', sans-serif", fontSize: '11px', letterSpacing: '0.05em'
                }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MemberProfilePage;
