import React, { useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ArrowLeft } from 'lucide-react';

interface HotelFormProps {
  onSuccess: (hotelId: string) => void;
  onCancel: () => void;
  initialData?: any;
}

const HotelForm: React.FC<HotelFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialData?.name || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [type, setType] = useState(initialData?.type || 'Heritage Hotel');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [lat, setLat] = useState(initialData?.coords?.lat || '');
  const [lng, setLng] = useState(initialData?.coords?.lng || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData && (!images || images.length === 0)) {
      setError('Please upload at least one image.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('city', city);
    formData.append('state', state);
    formData.append('type', type);
    formData.append('tagline', tagline);
    formData.append('address', address);
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('description', description);
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    try {
      setLoading(true);
      setError('');
      
      let res;
      if (initialData) {
        res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${initialData._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`,
          },
        });
      } else {
        res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user?.token}`,
          },
        });
      }
      onSuccess(res.data._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save hotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm border mb-6" style={{ borderColor: 'var(--color-line)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="t-section text-2xl m-0">{initialData ? 'Edit Hotel' : 'Add New Hotel'}</h2>
      </div>
      {error && <div className="p-4 mb-6 bg-red-100 text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="u-label-sm block mb-2">Hotel Name</label>
          <input
            type="text"
            className="field w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="u-label-sm block mb-2">City</label>
            <input
              type="text"
              className="field w-full"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="u-label-sm block mb-2">State</label>
            <input
              type="text"
              className="field w-full"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="u-label-sm block mb-2">Hotel Type</label>
            <input
              type="text"
              className="field w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="u-label-sm block mb-2">Tagline</label>
            <input
              type="text"
              className="field w-full"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="u-label-sm block mb-2">Full Address</label>
          <input
            type="text"
            className="field w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="u-label-sm block mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              className="field w-full"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              required
            />
          </div>
          <div>
            <label className="u-label-sm block mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              className="field w-full"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              required
            />
          </div>
        </div>
        <div>
          <label className="u-label-sm block mb-2">Description</label>
          <textarea
            className="field w-full"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label className="u-label-sm block mb-2">Images {initialData ? '(Optional: Leave blank to keep existing)' : '(One or more)'}</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="field w-full"
            onChange={(e) => setImages(e.target.files)}
            required={!initialData}
          />
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-outline justify-center">
            {loading ? 'Submitting...' : (initialData ? 'Update Hotel' : 'Submit Hotel')}
          </button>
          <button type="button" onClick={onCancel} className="u-label hover:underline" style={{ color: 'var(--color-muted)' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default HotelForm;
