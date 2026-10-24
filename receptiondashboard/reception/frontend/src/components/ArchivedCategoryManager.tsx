import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import type { GlobalRoomCategory } from './GlobalCategoryManager';

interface Hotel {
  _id: string;
  name: string;
  city: string;
}

const ArchivedCategoryManager: React.FC = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<GlobalRoomCategory[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArchivedCategories();
    fetchArchivedHotels();
  }, []);

  const fetchArchivedCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories?archived=true`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setCategories(data);
    } catch (error) {
      console.error('Error fetching archived categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedHotels = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels?archived=true`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setHotels(data);
    } catch (error) {
      console.error('Error fetching archived hotels:', error);
    }
  };

  const handleRestoreCategory = async (id: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/global-categories/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      fetchArchivedCategories();
    } catch (error) {
      console.error('Error restoring category:', error);
      alert('Failed to restore category');
    }
  };

  const handleRestoreHotel = async (hotelId: string) => {
    const isSuper = user?.role === 'superadmin';
    const msg = isSuper ? "Are you sure you want to restore this hotel?" : "Are you sure you want to request restoration for this hotel? An approval email will be sent.";
    
    if (window.confirm(msg)) {
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${hotelId}/restore`, {}, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        alert(data.message || (isSuper ? 'Hotel restored.' : 'Approval email sent.'));
        if (isSuper) {
          fetchArchivedHotels();
        }
      } catch (error: any) {
        console.error('Error restoring hotel:', error);
        alert(error.response?.data?.message || 'Failed to request restoration');
      }
    }
  };

  return (
    <div>
      <h2 className="t-section text-2xl mb-6">Archived</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="u-label-sm mb-4">Room Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(c => (
                <div key={c._id} className="p-4 border border-gray-300 bg-gray-50 flex flex-col justify-between opacity-80">
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-500">{c.name} (Archived)</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {c.amenities.map(a => (
                        <span key={a} className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded border border-gray-300">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 text-sm border-t border-gray-200 pt-3">
                    <button onClick={() => handleRestoreCategory(c._id)} className="text-green-600 font-semibold hover:underline">Restore Category</button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 col-span-2">No archived categories.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="u-label-sm mb-4">Hotels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotels.map(h => (
                <div key={h._id} className="p-4 border border-gray-300 bg-gray-50 flex flex-col justify-between opacity-80">
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-gray-500">{h.name}</h4>
                    <p className="text-sm text-gray-400 mb-4">{h.city}</p>
                  </div>
                  <div className="flex justify-end gap-3 text-sm border-t border-gray-200 pt-3">
                    <button onClick={() => handleRestoreHotel(h._id)} className="text-green-600 font-semibold hover:underline">
                      {user?.role === 'superadmin' ? 'Restore Hotel' : 'Request Restore'}
                    </button>
                  </div>
                </div>
              ))}
              {hotels.length === 0 && (
                <p className="text-gray-500 col-span-2">No archived hotels.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedCategoryManager;
