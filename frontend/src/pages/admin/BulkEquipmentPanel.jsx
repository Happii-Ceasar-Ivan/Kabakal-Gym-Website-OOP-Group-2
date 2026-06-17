import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { bulkCreateEquipment } from '../../services/api';
import styles from './Admin.module.css';

const LOADING_PHRASES = [
  "Racking the weights...",
  "Spotting your upload...",
  "Chalking up the database...",
  "Lifting heavy data...",
  "Getting those reps in...",
  "Almost there, don't drop it...",
  "Adding plates to the bar..."
];

export default function BulkEquipmentPanel({ onClose, onSuccess }) {
  const [items, setItems] = useState([
    { id: Date.now(), name: '', quantity: 1, file: null, previewUrl: null }
  ]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const { upload } = useCloudinaryUpload();

  // Cycle loading phrases every 2.5 seconds during upload
  useEffect(() => {
    let interval;
    if (uploading) {
      interval = setInterval(() => {
        setPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Date.now(), name: '', quantity: 1, file: null, previewUrl: null }]);
  };

  const handleRemoveItem = (idToRemove) => {
    setItems(prev => prev.filter(item => item.id !== idToRemove));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleFileSelect = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large! Maximum size is 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        // Cleanup old preview
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return { ...item, file, previewUrl };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const emptyNames = items.filter(i => !i.name.trim());
    if (emptyNames.length > 0) {
      toast.error("Please provide a name for all equipment items.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setPhraseIndex(0);

    try {
      const finalPayload = [];
      const totalSteps = items.length + 1; // N image uploads + 1 final backend call
      let currentStep = 0;

      // 1. Upload images to Cloudinary one by one (or in parallel)
      for (const item of items) {
        let secureUrl = null;
        if (item.file) {
          secureUrl = await upload(item.file);
        }
        
        finalPayload.push({
          equipmentName: item.name,
          quantity: parseInt(item.quantity) || 1,
          imageUrl: secureUrl
        });

        currentStep++;
        setProgress(Math.round((currentStep / totalSteps) * 100));
      }

      // 2. Send the bulk array to our C# backend
      const result = await bulkCreateEquipment(finalPayload);
      
      setProgress(100);
      toast.success(result.message || `Successfully added ${result.count} equipment items!`);
      
      // Cleanup object URLs
      items.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
      
      onSuccess(); // Close modal and refresh list
    } catch (err) {
      toast.error(`Bulk upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {uploading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#fff' }}>
              {LOADING_PHRASES[phraseIndex]}
            </h2>
            
            {/* Progress Bar Container */}
            <div style={{ width: '100%', maxWidth: '400px', height: '12px', backgroundColor: '#333', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
              {/* Progress Bar Fill */}
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--accent-yellow)', 
                width: `${progress}%`,
                transition: 'width 0.4s ease-out'
              }} />
            </div>
            
            <p style={{ color: '#888', fontSize: '0.9rem' }}>{progress}% Complete</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>Bulk Add Equipment</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {items.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                    
                    {/* Remove Item Button */}
                    {items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(item.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Remove Item"
                      >
                        &times;
                      </button>
                    )}

                    {/* Image Upload Area */}
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      <input 
                        type="file" 
                        id={`file-${item.id}`} 
                        accept=".jpg,.jpeg,.png" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileSelect(item.id, e)}
                      />
                      <label 
                        htmlFor={`file-${item.id}`} 
                        style={{ 
                          display: 'block', width: '100px', height: '100px', border: '2px dashed #444', borderRadius: '8px', 
                          cursor: 'pointer', overflow: 'hidden', position: 'relative', background: '#222'
                        }}
                      >
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '0.8rem' }}>
                            <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📷</span>
                            <span>Add Photo</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Form Fields */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                        <label className={styles.formLabel}>Equipment Name</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className={styles.formInput}
                          placeholder="e.g. Bench Press"
                          required
                        />
                      </div>
                      <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                        <label className={styles.formLabel}>Quantity (How many?)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="100"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className={styles.formInput}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Button */}
              <button 
                type="button" 
                onClick={handleAddItem}
                style={{ width: '100%', padding: '1rem', background: 'transparent', border: '2px dashed #444', color: '#888', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', marginBottom: '2rem', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}
              >
                + Upload One More?
              </button>

              <div className={styles.modalActions}>
                <button type="button" onClick={onClose} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" className={styles.primaryBtn} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                  Upload All {items.length > 1 ? `(${items.length} types)` : ''}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
