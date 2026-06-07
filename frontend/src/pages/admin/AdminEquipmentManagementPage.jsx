import { useState, useEffect, useRef } from 'react';
import { BASE_URL, getEquipment, createEquipment, updateEquipment, uploadEquipmentCsv, deleteEquipment, uploadEquipmentImage } from '../../services/api';
import styles from './Admin.module.css';

export default function AdminEquipmentManagementPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState(null);
  
  // Default values for new equipment
  const [form, setForm] = useState({ equipmentName: '', equipmentStatus: 'Available', isActive: true });

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [activeEqIdForImage, setActiveEqIdForImage] = useState(null);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await getEquipment();
      setEquipment(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openModal = (eq = null) => {
    if (eq) {
      setEditingEq(eq);
      setForm({
        equipmentName: eq.equipmentName,
        equipmentStatus: eq.equipmentStatus,
        isActive: eq.isActive
      });
    } else {
      setEditingEq(null);
      setForm({ equipmentName: '', equipmentStatus: 'Available', isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEq) {
        await updateEquipment(editingEq.equipmentId, form);
      } else {
        await createEquipment({ equipmentName: form.equipmentName });
      }
      closeModal();
      fetchEquipment();
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (eqId, eqName) => {
    if (!window.confirm(`Are you sure you want to delete "${eqName}"?`)) return;
    
    try {
      await deleteEquipment(eqId);
      fetchEquipment();
    } catch (err) {
      alert(`Failed to delete equipment: ${err.message}`);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Maximum size is 5MB.");
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const result = await uploadEquipmentCsv(file);
      alert(`Successfully uploaded ${result.count} equipment records!`);
      fetchEquipment();
    } catch (err) {
      alert(`CSV Upload Failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const triggerImageUpload = (id) => {
    setActiveEqIdForImage(id);
    imageInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeEqIdForImage) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large! Maximum size is 5MB.");
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      await uploadEquipmentImage(activeEqIdForImage, file);
      fetchEquipment();
    } catch (err) {
      alert(`Image Upload Failed: ${err.message}`);
    } finally {
      setUploading(false);
      setActiveEqIdForImage(null);
      e.target.value = '';
    }
  };

  if (loading) return <div>Loading equipment...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Equipment Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <input 
            type="file" 
            accept=".jpg,.jpeg,.png" 
            ref={imageInputRef} 
            onChange={handleImageUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className={styles.secondaryBtn}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '📁 Upload CSV'}
          </button>
          <button onClick={() => openModal()} className={styles.primaryBtn}>
            + Add Equipment
          </button>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Equipment Name</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq.equipmentId}>
                <td>
                  {eq.imageUrl ? (
                    <img src={`${BASE_URL}${eq.imageUrl}`} alt={eq.equipmentName} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', backgroundColor: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888' }}>
                      No Img
                    </div>
                  )}
                </td>
                <td>{eq.equipmentName}</td>
                <td>
                  <span className={`${styles.badge} ${
                    eq.equipmentStatus === 'Available' ? styles.badgeActive : 
                    eq.equipmentStatus === 'Under Maintenance' ? styles.badgeWarning : 
                    styles.badgeInactive
                  }`}>
                    {eq.equipmentStatus}
                  </span>
                </td>
                <td>{eq.isActive ? '✅ Yes' : '❌ No'}</td>
                <td>
                  <button onClick={() => triggerImageUpload(eq.equipmentId)} className={styles.actionBtn} style={{ color: '#60a5fa', marginRight: '1rem' }} disabled={uploading}>
                    📷 Upload Img
                  </button>
                  <button onClick={() => openModal(eq)} className={styles.actionBtn}>Edit</button>
                  <button 
                    onClick={() => handleDelete(eq.equipmentId, eq.equipmentName)} 
                    className={styles.actionBtn} 
                    style={{ color: '#ef4444', marginLeft: '1rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {equipment.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>
                  No equipment found. Add some!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingEq ? 'Edit Equipment' : 'Add Equipment'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Equipment Name</label>
                <input 
                  type="text" 
                  value={form.equipmentName}
                  onChange={(e) => setForm({...form, equipmentName: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>
              
              {editingEq && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select 
                      value={form.equipmentStatus}
                      onChange={(e) => setForm({...form, equipmentStatus: e.target.value})}
                      className={styles.formInput}
                    >
                      <option value="Available">Available</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                  <label className={styles.formCheckboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={form.isActive}
                      onChange={(e) => setForm({...form, isActive: e.target.checked})}
                    />
                    Active (visible in gym)
                  </label>
                </>
              )}
              
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingEq ? 'Save Changes' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
