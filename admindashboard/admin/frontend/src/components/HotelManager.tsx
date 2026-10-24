import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import HotelForm from './HotelForm';
import RoomCategoryForm from './RoomCategoryForm';
import useDashboardStore from '../store/dashboardStore';

interface Hotel {
  _id: string;
  name: string;
  city: string;
}

interface RoomCategory {
  _id: string;
  name: string;
  numberOfRooms: number;
  [key: string]: any;
}

const HotelManager: React.FC = () => {
  const { user } = useAuthStore();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);

  const [categories, setCategories] = useState<RoomCategory[]>([]);

  // For creating a new category
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [selectedGlobalCategoryId, setSelectedGlobalCategoryId] = useState('');
  const [isAddingCategoryDetails, setIsAddingCategoryDetails] = useState(false);

  // For editing a category
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);

  const { newlyCreatedCategoryId, pendingCategoryCreationForHotel, setNewlyCreatedCategoryId, setActiveTab, setPendingCategoryCreation } = useDashboardStore();

  useEffect(() => {
    fetchHotels();
    fetchGlobalCategories();
  }, []);

  useEffect(() => {
    if (newlyCreatedCategoryId && pendingCategoryCreationForHotel === selectedHotelId) {
      // Re-fetch to get the new global category
      fetchGlobalCategories().then(() => {
        setSelectedGlobalCategoryId(newlyCreatedCategoryId);
        setNewlyCreatedCategoryId(null);
        setPendingCategoryCreation(null);
        setIsAddingCategoryDetails(true);
        setEditingCategory(null);
      });
    }
  }, [newlyCreatedCategoryId, pendingCategoryCreationForHotel, selectedHotelId, setNewlyCreatedCategoryId, setPendingCategoryCreation]);

  const fetchGlobalCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/global-categories?archived=false`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setGlobalCategories(data);
    } catch (error) {
      console.error('Error fetching global categories:', error);
    }
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setHotels(data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (hotelId: string) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels/${hotelId}/categories`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSelectHotel = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setIsAddingHotel(false);
    setIsAddingCategoryDetails(false);
    setEditingCategory(null);
    setSelectedGlobalCategoryId('');
    fetchCategories(hotelId);
  };

  const handleStartAddCategory = () => {
    if (!selectedGlobalCategoryId) {
      setPendingCategoryCreation(selectedHotelId);
      setActiveTab('global_categories');
      return;
    }
    setIsAddingCategoryDetails(true);
    setEditingCategory(null);
  };

  const handleEditCategory = (category: RoomCategory) => {
    setEditingCategory(category);
    setIsAddingCategoryDetails(false);
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!selectedHotelId) return;
    if (window.confirm("Are you sure you want to delete this room category?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels/${selectedHotelId}/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        fetchCategories(selectedHotelId);
        if (editingCategory?._id === categoryId) {
          setEditingCategory(null);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  }

  const handleEditHotel = (hotel: any) => {
    setEditingHotel(hotel);
    setIsAddingHotel(true);
  };

  const handleDeleteHotel = async (hotelId: string) => {
    const isSuper = user?.role === 'superadmin';
    const msg = isSuper ? "Are you sure you want to delete this hotel?" : "Are you sure you want to request deletion for this hotel? An approval email will be sent.";

    if (window.confirm(msg)) {
      try {
        const { data } = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels/${hotelId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        alert(data.message || (isSuper ? 'Hotel deleted.' : 'Approval email sent.'));
        fetchHotels();
        if (isSuper && selectedHotelId === hotelId) {
          setSelectedHotelId(null);
        }
      } catch (error: any) {
        console.error('Error deleting hotel:', error);
        alert(error.response?.data?.message || 'Failed to request deletion');
      }
    }
  };

  const handleCategorySuccess = () => {
    setIsAddingCategoryDetails(false);
    setEditingCategory(null);
    setSelectedGlobalCategoryId('');
    if (selectedHotelId) fetchCategories(selectedHotelId);
  };

  if (isAddingHotel) {
    return (
      <HotelForm
        initialData={editingHotel}
        onSuccess={(id) => {
          fetchHotels();
          setIsAddingHotel(false);
          setEditingHotel(null);
          handleSelectHotel(id);
        }}
        onCancel={() => {
          setIsAddingHotel(false);
          setEditingHotel(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-section text-2xl">Hotels</h2>
        <button onClick={() => setIsAddingHotel(true)} className="btn-outline bg-black text-white hover:bg-gray-800">
          + Add New Hotel
        </button>
      </div>

      {loading ? (
        <p>Loading hotels...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 border-r pr-6" style={{ borderColor: 'var(--color-line)' }}>
            <h3 className="u-label-sm mb-4">Select a Hotel</h3>
            <ul className="space-y-2">
              {hotels.map(h => (
                <li key={h._id}>
                  <button
                    onClick={() => handleSelectHotel(h._id)}
                    className={`w-full text-left p-3 border ${selectedHotelId === h._id ? 'border-black bg-gray-100' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="font-bold">{h.name}</div>
                    <div className="text-sm text-gray-500">{h.city}</div>
                  </button>
                </li>
              ))}
              {hotels.length === 0 && <p className="text-gray-500">No hotels added yet.</p>}
            </ul>
          </div>

          <div className="col-span-2">
            {selectedHotelId ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="t-section text-xl">Room Categories</h3>
                  <div className="flex gap-4 text-sm font-semibold">
                    <button onClick={() => handleEditHotel(hotels.find(h => h._id === selectedHotelId))} className="text-blue-600 hover:underline">Edit Hotel</button>
                    <button onClick={() => handleDeleteHotel(selectedHotelId)} className="text-red-600 hover:underline">Delete Hotel</button>
                  </div>
                </div>
                <div className="mb-6">
                  {categories.map(c => (
                    <div key={c._id} className="p-3 border border-gray-200 mb-2 flex flex-col md:flex-row justify-between md:items-center bg-white shadow-sm">
                      <div>
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-gray-500 ml-2">({c.numberOfRooms} Rooms)</span>
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-3 text-sm">
                        <button onClick={() => handleEditCategory(c)} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDeleteCategory(c._id)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-gray-500 text-sm mb-4">No categories created yet.</p>}
                </div>

                {!isAddingCategoryDetails && !editingCategory ? (
                  <div className="bg-gray-50 p-4 border border-gray-200 flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="u-label-sm block mb-1">Select Room Category</label>
                      <select
                        className="field w-full"
                        value={selectedGlobalCategoryId}
                        onChange={e => setSelectedGlobalCategoryId(e.target.value)}
                      >
                        <option value="">-- Select a Category --</option>
                        {globalCategories.map(gc => (
                          <option key={gc._id} value={gc._id}>{gc.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartAddCategory}
                      className="btn-outline whitespace-nowrap"
                    >
                      Create Category
                    </button>
                  </div>
                ) : editingCategory ? (
                  <RoomCategoryForm
                    hotelId={selectedHotelId}
                    categoryName={editingCategory.name}
                    initialData={editingCategory}
                    onSuccess={handleCategorySuccess}
                    onCancel={() => setEditingCategory(null)}
                  />
                ) : (
                  <RoomCategoryForm
                    hotelId={selectedHotelId}
                    categoryName={globalCategories.find(g => g._id === selectedGlobalCategoryId)?.name || ''}
                    defaultAmenities={globalCategories.find(g => g._id === selectedGlobalCategoryId)?.amenities || []}
                    onSuccess={handleCategorySuccess}
                    onCancel={() => setIsAddingCategoryDetails(false)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-10 border border-dashed border-gray-300 text-gray-400">
                Select a hotel from the list to manage its room categories.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelManager;
