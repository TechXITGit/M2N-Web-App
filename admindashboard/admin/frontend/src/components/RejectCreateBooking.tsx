import React, { useState, useEffect } from 'react';
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

const RejectCreateBooking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'reject'>('create');
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reject') {
      fetchBookings();
    }
  }, [activeTab]);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create, Cancel and Review</h2>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'create' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'
              }`}
          >
            Create Walk-in Booking
          </button>
          <button
            onClick={() => setActiveTab('reject')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'reject' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'
              }`}
          >
            Cancel & Review Bookings
          </button>
        </div>

        <div className="p-6 min-h-[400px]">
          {activeTab === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Create New Booking</h3>
              <p className="text-gray-500 mb-6">Enter guest details to manually create a booking in the system.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-black focus:border-black" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-black focus:border-black" placeholder="+1 234 567 8900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Category</label>
                  <select className="w-full p-2 border border-gray-300 rounded focus:ring-black focus:border-black">
                    <option>Select a room...</option>
                    <option>Deluxe Room</option>
                    <option>Executive Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
                </div>
              </div>
              <button className="mt-6 w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                Create Booking
              </button>
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
                            <span className={`px-2 py-1 text-xs rounded-full uppercase tracking-wider ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
