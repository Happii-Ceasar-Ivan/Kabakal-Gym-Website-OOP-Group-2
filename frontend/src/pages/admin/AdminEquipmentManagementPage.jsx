import { useState, useEffect } from 'react';
import { getEquipment, createEquipment, updateEquipment } from '../../services/api';

export default function AdminEquipmentManagementPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState(null);
  
  // Default values for new equipment
  const [form, setForm] = useState({ equipmentName: '', equipmentStatus: 'Available', isActive: true });

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

  if (loading) return <div className="text-gray-300">Loading equipment...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Equipment Management</h1>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow"
        >
          + Add Equipment
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-700 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3">Equipment Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq.equipmentId} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="px-6 py-4 font-medium text-white">{eq.equipmentName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    eq.equipmentStatus === 'Available' ? 'bg-green-900 text-green-300' : 
                    eq.equipmentStatus === 'Under Maintenance' ? 'bg-yellow-900 text-yellow-300' : 
                    'bg-red-900 text-red-300'
                  }`}>
                    {eq.equipmentStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {eq.isActive ? '✅ Yes' : '❌ No'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => openModal(eq)}
                    className="text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {equipment.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No equipment found. Add some!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {editingEq ? 'Edit Equipment' : 'Add Equipment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Equipment Name</label>
                <input 
                  type="text" 
                  value={form.equipmentName}
                  onChange={(e) => setForm({...form, equipmentName: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  required
                />
              </div>
              
              {editingEq && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select 
                      value={form.equipmentStatus}
                      onChange={(e) => setForm({...form, equipmentStatus: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-4">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm({...form, isActive: e.target.checked})}
                      className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-300">
                      Active (visible in gym)
                    </label>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors"
                >
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
