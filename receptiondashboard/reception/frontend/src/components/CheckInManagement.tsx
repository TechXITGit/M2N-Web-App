import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { DoorOpen, Loader2, X, Search, Upload } from 'lucide-react';

interface Room {
  _id: string;
  roomNumber: string;
  status: 'Ready' | 'CheckIn' | 'HouseKeeping';
}

interface RoomCategory {
  _id: string;
  name: string;
  numberOfRooms: number;
  rooms: Room[];
}

const CheckInManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{ catId: string, roomId: string, roomNumber: string } | null>(null);
  const [bookingId, setBookingId] = useState('');
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [validIdFile, setValidIdFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    if (!user?.hotelId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${user.hotelId}/categories`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const updateRoomStatus = async (categoryId: string, roomId: string, newStatus: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels/${user?.hotelId}/categories/${categoryId}/rooms/${roomId}/status`, 
      { status: newStatus },
      { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      fetchCategories();
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  };

  const handleSearchBooking = async () => {
    if (!bookingId.trim()) {
      setErrorMsg('Please enter a booking ID');
      return;
    }
    try {
      setSearching(true);
      setErrorMsg('');
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/${bookingId.trim()}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setBookingDetails(data);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Booking not found or not authorized.');
      setBookingDetails(null);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!bookingDetails) {
      setErrorMsg('Please search and select a valid booking first.');
      return;
    }
    if (!validIdFile) {
      setErrorMsg('Please upload a valid ID.');
      return;
    }
    if (!selectedRoom) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('validId', validIdFile);
      formData.append('categoryId', selectedRoom.catId);
      formData.append('roomId', selectedRoom.roomId);

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/${bookingDetails._id}/checkin`, formData, {
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Cleanup & Refresh
      fetchCategories();
      closeModal();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred during check-in.';
      setErrorMsg(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (catId: string, roomId: string, roomNumber: string) => {
    setSelectedRoom({ catId, roomId, roomNumber });
    setShowModal(true);
    setBookingId('');
    setBookingDetails(null);
    setValidIdFile(null);
    setErrorMsg('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Check In Management</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'checkin' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            Check In
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'checkout' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            Check Out
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No room categories found for this hotel.</div>
      ) : (
        <div className="grid gap-8">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DoorOpen className="text-gray-500" />
                {cat.name} <span className="text-sm font-normal text-gray-500">({cat.numberOfRooms} total rooms)</span>
              </h3>
              
              <div className="flex flex-wrap gap-4">
                {cat.rooms && cat.rooms.length > 0 ? (
                  cat.rooms.map((room) => {
                    // Check In Tab Logic
                    if (activeTab === 'checkin') {
                      if (room.status === 'Ready') {
                        return (
                          <div key={room._id} className="flex flex-col items-center gap-2 p-4 border border-green-200 bg-green-50 rounded-lg min-w-[120px]">
                            <span className="font-bold text-green-800">Room {room.roomNumber}</span>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full uppercase font-bold">Ready</span>
                            <button
                              onClick={() => openModal(cat._id, room._id, room.roomNumber)}
                              className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                            >
                              Check In
                            </button>
                          </div>
                        );
                      } else if (room.status === 'HouseKeeping') {
                        return (
                          <div key={room._id} className="flex flex-col items-center gap-2 p-4 border border-orange-200 bg-orange-50 rounded-lg min-w-[120px]">
                            <span className="font-bold text-orange-800">Room {room.roomNumber}</span>
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full uppercase font-bold text-center">House Keeping</span>
                            <button
                              onClick={() => updateRoomStatus(cat._id, room._id, 'Ready')}
                              className="mt-2 text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition"
                            >
                              Mark Ready
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div key={room._id} className="flex flex-col items-center gap-2 p-4 border border-gray-200 bg-gray-50 rounded-lg min-w-[120px] opacity-70">
                            <span className="font-bold text-gray-700">Room {room.roomNumber}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase font-bold">Occupied</span>
                          </div>
                        );
                      }
                    }
                    
                    // Check Out Tab Logic
                    if (activeTab === 'checkout') {
                      if (room.status === 'CheckIn') {
                        return (
                          <div key={room._id} className="flex flex-col items-center gap-2 p-4 border border-blue-200 bg-blue-50 rounded-lg min-w-[120px]">
                            <span className="font-bold text-blue-800">Room {room.roomNumber}</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full uppercase font-bold">Checked In</span>
                            <button
                              onClick={() => updateRoomStatus(cat._id, room._id, 'HouseKeeping')}
                              className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Check Out
                            </button>
                          </div>
                        );
                      }
                      return null;
                    }
                    return null;
                  })
                ) : (
                  <p className="text-sm text-gray-400">No individual rooms initialized yet.</p>
                )}
                {/* Fallback for empty checkout views */}
                {activeTab === 'checkout' && cat.rooms?.filter(r => r.status === 'CheckIn').length === 0 && (
                  <p className="text-sm text-gray-400 italic">No rooms are currently checked in for this category.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check In Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Check In - Room {selectedRoom?.roomNumber}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Search Booking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID (5-digit numeric)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. 00000"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={handleSearchBooking}
                    disabled={searching}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
                  >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Search
                  </button>
                </div>
                {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
              </div>

              {/* Booking Details */}
              {bookingDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm relative">
                  <div className="absolute top-4 right-4 bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-md text-xs font-mono">
                    ID: {bookingDetails.bookingId}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Booking Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Guest Name</p>
                      <p className="font-medium">{bookingDetails.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Phone</p>
                      <p className="font-medium">{bookingDetails.userId?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Check In</p>
                      <p className="font-medium">{new Date(bookingDetails.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Check Out</p>
                      <p className="font-medium">{new Date(bookingDetails.checkOut).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Category</p>
                      <p className="font-medium">{bookingDetails.roomCategoryId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Guests</p>
                      <p className="font-medium">{bookingDetails.adults} Adults, {bookingDetails.children} Children</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ID Upload */}
              {bookingDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Valid ID (Required)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      {validIdFile ? (
                        <p className="text-sm font-medium text-black">{validIdFile.name}</p>
                      ) : (
                        <>
                          <p className="mb-1 text-sm font-semibold">Click to upload</p>
                          <p className="text-xs">PNG, JPG or PDF</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setValidIdFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={!bookingDetails || !validIdFile || submitting}
                className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Confirm Check In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInManagement;
