import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ArrowLeft } from 'lucide-react';
import useDashboardStore from '../store/dashboardStore';

export interface GlobalRoomCategory {
  _id: string;
  name: string;
  amenities: string[];
  isArchived: boolean;
}

const GlobalCategoryManager: React.FC = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<GlobalRoomCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [amenitiesStr, setAmenitiesStr] = useState('');

  const { pendingCategoryCreationForHotel, setPendingCategoryCreation, setNewlyCreatedCategoryId, setActiveTab } = useDashboardStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (pendingCategoryCreationForHotel) {
      setIsAdding(true);
    }
  }, [pendingCategoryCreationForHotel]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories?archived=false`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setCategories(data);
    } catch (error) {
      console.error('Error fetching global categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amenities = amenitiesStr.split(',').map(a => a.trim()).filter(a => a);
    
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories/${editingId}`, { name, amenities }, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories`, { name, amenities }, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        
        if (pendingCategoryCreationForHotel) {
          setNewlyCreatedCategoryId(response.data._id);
          setActiveTab('hotels');
        }
      }
      resetForm(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving global category:', error);
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (cat: GlobalRoomCategory) => {
    setEditingId(cat._id);
    setName(cat.name);
    setAmenitiesStr(cat.amenities.join(', '));
    setIsAdding(true);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this category?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        fetchCategories();
      } catch (error) {
        console.error('Error archiving category:', error);
      }
    }
  };

  const resetForm = (isCancel = false) => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setAmenitiesStr('');
    if (isCancel && pendingCategoryCreationForHotel) {
      setPendingCategoryCreation(null);
      setActiveTab('hotels');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-section text-2xl">Room Categories</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-outline bg-black text-white hover:bg-gray-800">
            + Add New Category
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-6 shadow-sm border mb-8" style={{ borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => resetForm(true)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h3 className="t-section text-xl m-0">{editingId ? 'Edit Category' : 'Create Category'}</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="u-label-sm block mb-1">Category Name (e.g. Presidential Suite)</label>
              <input 
                type="text" 
                className="field w-full" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="u-label-sm block mb-1">Default Amenities (Comma separated)</label>
              <input 
                type="text" 
                className="field w-full" 
                value={amenitiesStr} 
                onChange={(e) => setAmenitiesStr(e.target.value)} 
                placeholder="TV, Wifi, Mini Bar, Ocean View" 
                required 
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn-outline">
                Save
              </button>
              <button type="button" onClick={() => resetForm(true)} className="u-label hover:underline text-gray-500">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(c => (
            <div key={c._id} className="p-4 border border-gray-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg mb-2">{c.name}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {c.amenities.map(a => (
                    <span key={a} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border border-gray-200">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 text-sm border-t border-gray-100 pt-3">
                <button onClick={() => handleEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleArchive(c._id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !isAdding && (
            <p className="text-gray-500 col-span-2">No global categories found. Create one to get started!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalCategoryManager;
