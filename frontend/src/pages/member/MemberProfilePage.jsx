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
  
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setBioInput(data.bio || '');
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
      setIsEditing(false);
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
    return <div style={{ color: '#f7f014', textAlign: 'center', marginTop: '50px' }}>Loading profile...</div>;
  }

  const activeSub = profile?.subscriptions?.find(s => s.status === 'Active' && new Date(s.endDate) > new Date());
  const tier = activeSub ? activeSub.plan.name : 'Basic';
  const status = activeSub ? 'ACTIVE' : 'INACTIVE';
  
  const bgStyle = profile?.backgroundPictureUrl 
    ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${profile.backgroundPictureUrl})` }
    : {};

  return (
    <div className={styles.profileContainer}>
      <div className={styles.headerBackground} style={bgStyle}>
        <div className={styles.headerArrowContainer}>
           <label style={{ position: 'absolute', top: 20, right: 20, cursor: uploadingBg ? 'not-allowed' : 'pointer', color: '#f7f014', fontSize: '12px', border: '1px solid #f7f014', padding: '5px 10px', borderRadius: '5px', backgroundColor: 'rgba(0,0,0,0.5)'}}>
              {uploadingBg ? "Uploading..." : "Change Banner"}
              <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleBgUpload} disabled={uploadingBg} />
           </label>
        </div>

        <label className={styles.avatarWrapper} style={{ cursor: uploadingPfp ? 'not-allowed' : 'pointer' }}>
          <div className={styles.avatarCircle} style={{ opacity: uploadingPfp ? 0.5 : 1 }}>
            {uploadingPfp ? (
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
            onChange={handlePfpUpload}
            disabled={uploadingPfp}
          />
        </label>

        <div className={styles.profileName}>
          {profile?.firstName} {profile?.lastName}
        </div>
        <div className={styles.profileSubtextQuote}>
          {isEditing ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="text" 
                  value={bioInput} 
                  onChange={(e) => setBioInput(e.target.value)} 
                  maxLength={150}
                  style={{ background: 'transparent', border: '1px solid #f7f014', color: '#fff', textAlign: 'center', padding: '5px', borderRadius: '5px', width: '250px'}}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                   <button onClick={saveBio} style={{ background: '#f7f014', color: '#000', border: 'none', padding: '3px 10px', cursor: 'pointer', borderRadius: '3px', fontWeight: 'bold' }}>Save</button>
                   <button onClick={() => { setIsEditing(false); setBioInput(profile.bio || ''); }} style={{ background: 'transparent', color: '#f7f014', border: '1px solid #f7f014', padding: '3px 10px', cursor: 'pointer', borderRadius: '3px' }}>Cancel</button>
                </div>
             </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
               "{profile?.bio || 'Embrace the struggle.'}"
               <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✎</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.settingContent}>
        
        {/* Personal Information Group */}
        <div className={styles.settingGroup}>
          <div className={styles.settingGroupTitle}>Personal Information</div>
          <div className={styles.settingGroupBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{profile?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tier:</span>
              <span className={styles.value}>{tier}</span>
              <span className={styles.divider}>|</span>
              <span className={styles.label}>Status:</span>
              <span className={styles.statusBadge} style={{ backgroundColor: status === 'ACTIVE' ? '#228B22' : '#555' }}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Account Management Group */}
        <div className={styles.settingGroup}>
          <div className={styles.settingGroupTitle}>Account Management</div>
          <div className={styles.settingGroupBody}>
            <div className={styles.menuList}>
              <div className={styles.menuItem} onClick={handleExportData}>
                Export My Data
              </div>
              <div className={styles.menuItem} onClick={() => setShowDeleteModal(true)} style={{ color: '#ff4444', borderBottom: 'none' }}>
                Delete Account
              </div>
            </div>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          LOG OUT
        </button>

      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: '#060407', border: '2px solid #ff4444', borderRadius: '12px',
            padding: '30px', maxWidth: '400px', textAlign: 'center'
          }}>
            <h2 style={{ color: '#ff4444', fontFamily: "'Archive', sans-serif", margin: '0 0 15px 0' }}>DELETE ACCOUNT</h2>
            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              You are about to delete your account. Do you want to temporarily deactivate it, or permanently destroy all your personal data?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => executeDelete(false)}
                disabled={deleting}
                style={{ 
                  padding: '12px', backgroundColor: 'transparent', border: '2px solid #f7f014', color: '#f7f014',
                  borderRadius: '8px', fontWeight: 'bold', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'Fira Code', monospace" 
                }}>
                DEACTIVATE (Can be restored)
              </button>
              
              <button 
                onClick={() => executeDelete(true)}
                disabled={deleting}
                style={{ 
                  padding: '12px', backgroundColor: '#ff4444', border: 'none', color: '#fff',
                  borderRadius: '8px', fontWeight: 'bold', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'Fira Code', monospace" 
                }}>
                PERMANENTLY DELETE DATA
              </button>

              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ 
                  padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#888',
                  cursor: 'pointer', marginTop: '10px'
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MemberProfilePage;
