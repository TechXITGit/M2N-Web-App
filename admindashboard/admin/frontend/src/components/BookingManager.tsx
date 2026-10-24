import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

interface Booking {
  _id: string;
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
  numberOfRooms: number;
}

const BookingManager: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    fetchHotels();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchCategories(selectedHotelId);
    } else {
      setCategories([]);
    }
  }, [selectedHotelId]);

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setHotels(data);
      if (data.length > 0) {
        setSelectedHotelId(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

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

  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (selectedHotelId) {
      result = result.filter(b => b.hotelId?._id === selectedHotelId);
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const checkDateMatches = (b: Booking) => {
        const d = new Date(b.createdAt);

        if (dateFilter === 'today') {
          const start = new Date(today);
          start.setHours(0, 0, 0, 0);
          return d >= start && d <= today;
        }
        if (dateFilter === 'past_7') {
          const start = new Date(today);
          start.setDate(today.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          return d >= start && d <= today;
        }
        if (dateFilter === 'past_30') {
          const start = new Date(today);
          start.setDate(today.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          return d >= start && d <= today;
        }
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
        }
        return true;
      };
      result = result.filter(checkDateMatches);
    }

    return result;
  }, [bookings, selectedHotelId, dateFilter, customStartDate, customEndDate]);

  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return categories.map(cat => {
      // Find bookings for this category that are confirmed and overlap with today
      const activeBookings = filteredBookings.filter(b => {
        if (b.status !== 'confirmed') return false;
        if (b.roomCategoryId?._id !== cat._id) return false;

        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(b.checkOut);
        checkOut.setHours(0, 0, 0, 0);

        // Active if checkOut is in the future or today
        return checkOut >= today;
      });

      const bookedCount = activeBookings.reduce((sum, b) => sum + b.quantity, 0);
      const leftCount = Math.max(0, cat.numberOfRooms - bookedCount);

      return {
        categoryName: cat.name,
        total: cat.numberOfRooms,
        booked: bookedCount,
        left: leftCount
      };
    });
  }, [filteredBookings, categories]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-section text-2xl">Bookings & Availability</h2>
        {hotels.length > 0 && (
          <select
            className="field bg-white border border-gray-300 p-2 rounded"
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
          >
            <option value="">All Hotels</option>
            {hotels.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedHotelId && categories.length > 0 && (
        <div className="mb-8">
          <h3 className="u-label-sm mb-4 text-gray-500">Live Room Inventory (Current & Upcoming)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todayStats.map((stat, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 p-4 rounded shadow-sm">
                <p className="font-bold text-lg mb-2">{stat.categoryName}</p>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Total Capacity:</span>
                  <span>{stat.total}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Active Reservations:</span>
                  <span className="text-red-600 font-semibold">{stat.booked}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 mt-2">
                  <span>Remaining Inventory:</span>
                  <span className="text-green-600">{stat.left}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Filter by Date:</label>
          <select
            className="field bg-white border border-gray-300 p-2 rounded text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="past_7">Past 7 Days</option>
            <option value="past_30">Past 1 Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="field bg-white border border-gray-300 p-2 rounded text-sm"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              className="field bg-white border border-gray-300 p-2 rounded text-sm"
              value={customEndDate}
              min={customStartDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="u-label-sm mb-4 text-gray-500">All Reservations</h3>
        {loading ? (
          <p>Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-3 font-semibold text-sm">Guest</th>
                  <th className="p-3 font-semibold text-sm">Room</th>
                  <th className="p-3 font-semibold text-sm">Booked On</th>
                  <th className="p-3 font-semibold text-sm">Check In</th>
                  <th className="p-3 font-semibold text-sm">Check Out</th>
                  <th className="p-3 font-semibold text-sm">Amount</th>
                  <th className="p-3 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{b.userId?.name}</div>
                      <div className="text-xs text-gray-500">{b.userId?.email}</div>
                      <div className="text-xs text-gray-500">{b.userId?.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{b.roomCategoryId?.name}</div>
                      <div className="text-xs text-gray-500">Qty: {b.quantity}</div>
                    </td>
                    <td className="p-3">
                      <div>{new Date(b.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3">
                      <div>{new Date(b.checkIn).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{b.checkInTime || '14:00'}</div>
                    </td>
                    <td className="p-3">
                      <div>{new Date(b.checkOut).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{b.checkOutTime || '11:00'}</div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManager;
