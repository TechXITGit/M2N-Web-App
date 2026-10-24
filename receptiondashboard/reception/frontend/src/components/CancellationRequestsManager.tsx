import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const CancellationRequestsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/cancellation-requests`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch cancellation requests', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/${id}/accept-cancellation`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setRequests(requests.map(req => req._id === id ? { ...req, status: 'cancelled' } : req));
      alert('Cancellation accepted successfully and refund initiated.');
    } catch (error) {
      console.error('Failed to accept cancellation', error);
      alert('Failed to accept cancellation.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    let result = requests;
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const checkDateMatches = (r: any) => {
         const d = new Date(r.updatedAt || r.createdAt);
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
  }, [requests, dateFilter, customStartDate, customEndDate]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="t-section text-2xl">Cancellation Requests</h2>
        
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filter Date:</label>
            <select 
              className="field bg-white border border-gray-300 p-1.5 rounded text-sm"
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
                className="field bg-white border border-gray-300 p-1.5 rounded text-sm"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span className="text-gray-500 text-sm">to</span>
              <input 
                type="date" 
                className="field bg-white border border-gray-300 p-1.5 rounded text-sm"
                value={customEndDate}
                min={customStartDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg text-gray-500">
          No cancellation requests match your filter.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const isProcessed = request.status === 'cancelled';
            return (
              <div key={request._id} className={`p-6 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isProcessed ? 'opacity-70 bg-gray-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-gray-800">{request.hotelId?.name}</p>
                    {isProcessed ? (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded">Processed</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase rounded">Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{request.userId?.name} ({request.userId?.email})</p>
                  <div className="text-sm text-gray-600 flex flex-col sm:flex-row gap-2 sm:gap-6">
                    <span><strong>Check-in:</strong> {new Date(request.checkIn).toLocaleDateString()}</span>
                    <span><strong>Amount:</strong> ₹{request.totalAmount}</span>
                    <span><strong>Requested:</strong> {new Date(request.updatedAt || request.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(request._id)}
                  disabled={processingId === request._id || isProcessed}
                  className={`px-6 py-2 rounded font-medium transition-colors ${
                    isProcessed 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isProcessed 
                    ? 'Refund Processed' 
                    : processingId === request._id 
                      ? 'Processing...' 
                      : 'Accept & Process Refund'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CancellationRequestsManager;
