import { useState, useEffect } from 'react';
import { getMembers, updateMember } from '../../services/api';
import styles from './Admin.module.css';

export default function AdminMemberManagementPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', isActive: true });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembers(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      isActive: member.isActive,
    });
  };

  const closeEditModal = () => {
    setEditingMember(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateMember(editingMember.userId, editForm);
      closeEditModal();
      fetchMembers();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  if (loading) return <div>Loading members...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Member Management</h1>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId}>
                <td>{m.firstName} {m.lastName}</td>
                <td>{m.email}</td>
                <td>
                  <span className={`${styles.badge} ${m.role === 'Admin' ? styles.badgeWarning : styles.badgeActive}`}>
                    {m.role}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${m.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => openEditModal(m)} className={styles.actionBtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Edit Member</h2>
            <form onSubmit={handleUpdate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <input 
                  type="text" 
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input 
                  type="text" 
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>
              <label className={styles.formCheckboxLabel}>
                <input 
                  type="checkbox" 
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                />
                Account is Active
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeEditModal} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
