import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ArrowLeft } from 'lucide-react';

interface RoomCategoryFormProps {
  hotelId: string;
  categoryName: string;
  defaultAmenities?: string[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const RoomCategoryForm: React.FC<RoomCategoryFormProps> = ({ hotelId, categoryName, defaultAmenities = [], initialData, onSuccess, onCancel }) => {
  const { user } = useAuthStore();
  
  const [name, setName] = useState(categoryName);
  const [numberOfRooms, setNumberOfRooms] = useState(initialData?.numberOfRooms?.toString() || '1');
  const [roomSize, setRoomSize] = useState(initialData?.roomSize || '');
  const [numberOfBeds, setNumberOfBeds] = useState(initialData?.numberOfBeds?.toString() || '1');
  const [view, setView] = useState(initialData?.view || '');
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '2');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  
  // Amenities handling
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);
  const [checkedAmenities, setCheckedAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  
  const [images, setImages] = useState<FileList | null>(null);
  const [galleryImages, setGalleryImages] = useState<FileList | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If categoryName changes (e.g. creating a new one) and not editing, we can update it
    if (!initialData) {
        setName(categoryName);
        setAvailableAmenities(defaultAmenities);
        setCheckedAmenities([]);
    } else {
        // If editing, we need to figure out which features were from defaultAmenities and which are custom
        const existingFeatures: string[] = initialData.features || [];
        
        // available amenities is default + any custom ones that were saved
        const allSet = new Set([...defaultAmenities, ...existingFeatures]);
        setAvailableAmenities(Array.from(allSet));
        
        setCheckedAmenities(existingFeatures);
    }
  }, [categoryName, initialData, defaultAmenities]);

  const handleAddAmenity = () => {
    const trimmed = newAmenity.trim();
    if (trimmed && !availableAmenities.includes(trimmed)) {
      setAvailableAmenities([...availableAmenities, trimmed]);
      setCheckedAmenities([...checkedAmenities, trimmed]);
      setNewAmenity('');
    } else if (trimmed && availableAmenities.includes(trimmed) && !checkedAmenities.includes(trimmed)) {
      setCheckedAmenities([...checkedAmenities, trimmed]);
      setNewAmenity('');
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    if (checkedAmenities.includes(amenity)) {
      setCheckedAmenities(checkedAmenities.filter(a => a !== amenity));
    } else {
      setCheckedAmenities([...checkedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedFeatures = checkedAmenities.join(',');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('numberOfRooms', numberOfRooms);
    formData.append('roomSize', roomSize);
    formData.append('numberOfBeds', numberOfBeds);
    formData.append('view', view);
    formData.append('capacity', capacity);
    formData.append('price', price);
    formData.append('features', combinedFeatures);

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    if (galleryImages) {
      for (let i = 0; i < galleryImages.length; i++) {
        formData.append('galleryImages', galleryImages[i]);
      }
    }

    try {
      setLoading(true);
      setError('');
      
      if (initialData && initialData._id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${hotelId}/categories/${initialData._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`,
          },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${hotelId}/categories`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`,
          },
        });
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save room category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 shadow-inner border mt-4" style={{ borderColor: 'var(--color-line)' }}>
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h3 className="t-section text-xl m-0">{initialData ? `Edit "${initialData.name}"` : `Details for "${categoryName}"`}</h3>
      </div>
      {error && <div className="p-4 mb-4 bg-red-100 text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialData && (
            <div className="md:col-span-2">
                <label className="u-label-sm block mb-1">Category Name</label>
                <input type="text" className="field w-full" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="u-label-sm block mb-1">Number of Rooms</label>
            <input type="number" className="field w-full" value={numberOfRooms} onChange={(e) => setNumberOfRooms(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required min="1" />
          </div>
          <div>
            <label className="u-label-sm block mb-1">Room Size (sq.ft)</label>
            <input type="text" className="field w-full" value={roomSize} onChange={(e) => setRoomSize(e.target.value)} required />
          </div>
          <div>
            <label className="u-label-sm block mb-1">Number of Beds</label>
            <input type="number" className="field w-full" value={numberOfBeds} onChange={(e) => setNumberOfBeds(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required min="1" />
          </div>
          <div>
            <label className="u-label-sm block mb-1">Capacity (Guests)</label>
            <input type="number" className="field w-full" value={capacity} onChange={(e) => setCapacity(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required min="1" />
          </div>
          <div>
            <label className="u-label-sm block mb-1">View (e.g. Ocean, City)</label>
            <input type="text" className="field w-full" value={view} onChange={(e) => setView(e.target.value)} required />
          </div>
          <div>
            <label className="u-label-sm block mb-1">Pricing per Night</label>
            <input type="number" className="field w-full" value={price} onChange={(e) => setPrice(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required min="0" />
          </div>
          {availableAmenities.length > 0 && (
            <div className="md:col-span-2">
              <label className="u-label-sm block mb-2">Category Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 border border-gray-200 rounded">
                {availableAmenities.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`amenity-${amenity}`}
                      checked={checkedAmenities.includes(amenity)}
                      onChange={() => handleToggleAmenity(amenity)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer select-none">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="md:col-span-2 flex gap-4 items-end">
            <div className="flex-1">
                <label className="u-label-sm block mb-1">Add Custom Amenity</label>
                <input 
                  type="text" 
                  className="field w-full" 
                  value={newAmenity} 
                  onChange={(e) => setNewAmenity(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }}
                  placeholder="e.g. Private Pool" 
                />
            </div>
            <button type="button" onClick={handleAddAmenity} className="btn-outline">Add</button>
          </div>
          <div className="md:col-span-2">
            <label className="u-label-sm block mb-1">Main Images {initialData && "(Upload to add more)"}</label>
            <input type="file" multiple accept="image/*" className="field w-full" onChange={(e) => setImages(e.target.files)} />
          </div>
          <div className="md:col-span-2">
            <label className="u-label-sm block mb-1">Gallery Images (Showcase) {initialData && "(Upload to add more)"}</label>
            <input type="file" multiple accept="image/*" className="field w-full" onChange={(e) => setGalleryImages(e.target.files)} />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="btn-outline justify-center">
            {loading ? 'Saving...' : 'Save Category Details'}
          </button>
          <button type="button" onClick={onCancel} className="u-label hover:underline" style={{ color: 'var(--color-muted)' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomCategoryForm;
