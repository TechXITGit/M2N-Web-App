import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

interface Booking {
  _id: string;
  bookingId?: string;
  hotelId: { _id: string; name: string };
  roomCategoryId: { _id: string; name: string };
  userId: { _id: string; name: string; email: string; phone?: string };
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  checkOutTime: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface RoomCategory {
  _id: string;
  name: string;
  price: number;
}

interface Room {
  roomNumber: string;
  status: string;
}

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = (baseDateStr?: string) => {
  const d = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
};

const RejectCreateBooking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'reject'>('create');
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [checkIn, setCheckIn] = useState(getLocalDateString());
  const [checkOut, setCheckOut] = useState(getTomorrowDateString());
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [assignedRoomNumber, setAssignedRoomNumber] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);

  // Data states
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(false);

  // UI state
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!user?.hotelId) return;
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/public/hotels/${user.hotelId}/categories`);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'reject') {
      fetchBookings();
    } else if (activeTab === 'create') {
      fetchCategories();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!categoryId || !checkIn || !checkOut) {
        setAvailableRooms([]);
        return;
      }
      try {
        setFetchingRooms(true);
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/available-rooms`, {
          params: { categoryId, checkIn, checkOut },
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setAvailableRooms(data);
        setAssignedRoomNumber(''); // Reset on new fetch
      } catch (error) {
        console.error('Error fetching available rooms:', error);
      } finally {
        setFetchingRooms(false);
      }
    };

    fetchAvailableRooms();
  }, [categoryId, checkIn, checkOut, user?.token]);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIdFile(e.dataTransfer.files[0]);
    }
  };

  const handlePreview = () => {
    if (!firstName || !lastName || !phone || !checkIn || !checkOut || !categoryId || !assignedRoomNumber || !idFile) {
      alert('Please fill all required fields and upload an ID.');
      return;
    }
    setIsPreview(true);
  };

  const submitBooking = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('hotelId', user?.hotelId || '');
      formData.append('roomCategoryId', categoryId);
      formData.append('checkIn', checkIn);
      formData.append('checkOut', checkOut);
      formData.append('quantity', '1');
      formData.append('adults', adults);
      formData.append('children', children);
      
      const guestName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      formData.append('guestName', guestName);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('nationality', nationality);
      formData.append('assignedRoomNumber', assignedRoomNumber);
      if (idFile) {
        formData.append('validId', idFile);
      }

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/walkin`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Booking created successfully!');
      
      // Reset form
      setIsPreview(false);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNationality('');
      setCheckIn('');
      setCheckOut('');
      setAdults('1');
      setChildren('0');
      setCategoryId('');
      setAssignedRoomNumber('');
      setIdFile(null);
      
    } catch (error: any) {
      console.error('Error creating walkin booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1a202c]">Create, Cancel and Review</h2>
      </div>

      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('create'); setIsPreview(false); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === 'create' ? 'bg-[#0f172a] text-white' : 'hover:bg-gray-50 text-gray-500'
            }`}
          >
            Create Walk-in Booking
          </button>
          <button
            onClick={() => setActiveTab('reject')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              activeTab === 'reject' ? 'bg-[#0f172a] text-white' : 'hover:bg-gray-50 text-gray-500'
            }`}
          >
            Cancel & Review Bookings
          </button>
        </div>

        <div className="p-8 min-h-[400px]">
          {activeTab === 'create' && !isPreview && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#1e293b]">Create Walk-in Booking</h3>
                <p className="text-gray-500 mt-1">Fill in the guest details to instantly assign a room.</p>
              </div>
              
              <div className="space-y-8">
                {/* Guest Identity */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#3b82f6]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="font-semibold text-[#1e293b]">Guest Identity</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#3b82f6]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h4 className="font-semibold text-[#1e293b]">Contact Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                      <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                </section>

                {/* Booking Details */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#3b82f6]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="font-semibold text-[#1e293b]">Booking Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check In *</label>
                      <input
                        type="date"
                        value={checkIn}
                        min={getLocalDateString()}
                        onChange={e => {
                          const val = e.target.value;
                          setCheckIn(val);
                          if (!checkOut || checkOut <= val) {
                            setCheckOut(getTomorrowDateString(val));
                          }
                        }}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check Out *</label>
                      <input
                        type="date"
                        value={checkOut}
                        min={getTomorrowDateString(checkIn)}
                        onChange={e => setCheckOut(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adults *</label>
                      <input type="number" min="1" value={adults} onChange={e => setAdults(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                      <input type="number" min="0" value={children} onChange={e => setChildren(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                </section>

                {/* Room Assignment */}
                <section className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h4 className="font-semibold text-indigo-900">Room Assignment</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-indigo-900 mb-1">Room Category *</label>
                      <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all">
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-900 mb-1">Assign Available Room *</label>
                      <select 
                        value={assignedRoomNumber} 
                        onChange={e => setAssignedRoomNumber(e.target.value)} 
                        disabled={fetchingRooms || !categoryId || !checkIn || !checkOut}
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                      >
                        <option value="">
                          {fetchingRooms ? 'Loading...' : (!categoryId || !checkIn || !checkOut) ? 'Select dates & category first' : 'Select Room'}
                        </option>
                        {availableRooms.map(r => (
                          <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Identity Document */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#3b82f6]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="font-semibold text-[#1e293b]">Identity Document</h4>
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                    
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      <span className="text-[#3b82f6]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Valid Government ID (Aadhar, Passport, etc) up to 10MB</p>
                    {idFile && (
                      <div className="mt-4 p-2 bg-white rounded border border-gray-200 text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        {idFile.name}
                      </div>
                    )}
                  </div>
                </section>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handlePreview}
                    className="bg-[#4f46e5] text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
                  >
                    Preview Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && isPreview && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Review Booking Details</h3>
                <button onClick={() => setIsPreview(false)} className="text-indigo-600 font-medium hover:text-indigo-800">
                  Edit Details
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">Guest Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{firstName} {middleName} {lastName}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{phone}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{email || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Address:</span> <span className="font-medium">{address}</span></div>
                  <div><span className="text-gray-500">Nationality:</span> <span className="font-medium">{nationality}</span></div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-semibold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Stay Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-indigo-400">Check In:</span> <span className="font-medium text-indigo-900">{checkIn}</span></div>
                  <div><span className="text-indigo-400">Check Out:</span> <span className="font-medium text-indigo-900">{checkOut}</span></div>
                  <div><span className="text-indigo-400">Guests:</span> <span className="font-medium text-indigo-900">{adults} Adults, {children} Children</span></div>
                  <div><span className="text-indigo-400">Room:</span> <span className="font-medium text-indigo-900">{categories.find(c => c._id === categoryId)?.name} - Room {assignedRoomNumber}</span></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 text-sm">Document:</span>
                  <p className="font-medium text-sm">{idFile?.name}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsPreview(false)}
                  disabled={submitting}
                  className="flex-1 border border-gray-300 bg-white text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back to Edit
                </button>
                <button 
                  onClick={submitBooking}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reject' && (
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">All Reservations</h3>
              <p className="text-gray-500 mb-6">Review bookings and cancel them if necessary.</p>
              
              {loading ? (
                <p>Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">No bookings to review at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="p-3 font-semibold text-sm">ID</th>
                        <th className="p-3 font-semibold text-sm">Guest</th>
                        <th className="p-3 font-semibold text-sm">Room</th>
                        <th className="p-3 font-semibold text-sm">Check In / Out</th>
                        <th className="p-3 font-semibold text-sm">Amount</th>
                        <th className="p-3 font-semibold text-sm">Status</th>
                        <th className="p-3 font-semibold text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">{b.bookingId || b._id}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{b.userId?.name}</div>
                            <div className="text-xs text-gray-500">{b.userId?.email}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{b.roomCategoryId?.name}</div>
                            <div className="text-xs text-gray-500">Qty: {b.quantity}</div>
                          </td>
                          <td className="p-3">
                            <div>In: {new Date(b.checkIn).toLocaleDateString()}</div>
                            <div>Out: {new Date(b.checkOut).toLocaleDateString()}</div>
                          </td>
                          <td className="p-3 font-medium">₹{b.totalAmount?.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full uppercase tracking-wider ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {b.status !== 'cancelled' && (
                              <button 
                                onClick={() => handleCancelBooking(b._id)}
                                className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RejectCreateBooking;
