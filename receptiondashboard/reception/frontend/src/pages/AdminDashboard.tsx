import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import BookingManager from '../components/BookingManager';
import RejectCreateBooking from '../components/RejectCreateBooking';
import CancellationRequestsManager from '../components/CancellationRequestsManager';
import CheckInManagement from '../components/CheckInManagement';
import { LogOut, ArrowLeft, Calendar, FilePlus2, Utensils, BellRing, UserMinus, Bell, DoorOpen } from 'lucide-react';
import axios from 'axios';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // View states: null (grid), 'bookings', 'reject_create', 'cancellations', 'checkin', 'banquet', 'room_service'
  const [activeView, setActiveView] = useState<string | null>(null);
  const [pendingCancellations, setPendingCancellations] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      const fetchPending = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/bookings/cancellation-requests`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const pending = res.data.filter((req: any) => req.status !== 'cancelled');
          setPendingCancellations(pending.length);
        } catch (error) {
          console.error('Failed to fetch pending cancellations', error);
        }
      };
      
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mt-10">
      {/* 1. Bookings & Inventory */}
      <button 
        onClick={() => setActiveView('bookings')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group"
      >
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
          <Calendar size={40} className="text-gray-700 group-hover:text-white transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Bookings & Inventory</h2>
        <p className="text-gray-500 text-sm text-center">Manage room availability and view reservations.</p>
      </button>

      {/* 2. Reject/Create */}
      <button 
        onClick={() => setActiveView('reject_create')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group"
      >
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
          <FilePlus2 size={40} className="text-gray-700 group-hover:text-white transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Create & Modify</h2>
        <p className="text-gray-500 text-sm text-center">Create walk-in bookings and modify existing ones.</p>
      </button>
      
      {/* 3. Cancellation Requests */}
      <button 
        onClick={() => setActiveView('cancellations')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group relative"
      >
        {pendingCancellations > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Bell size={12} />
            {pendingCancellations} Pending
          </div>
        )}
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
          <UserMinus size={40} className="text-gray-700 group-hover:text-white transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Cancellation Requests</h2>
        <p className="text-gray-500 text-sm text-center">Review and process booking cancellation requests.</p>
      </button>

      {/* 4. Check In Management */}
      <button 
        onClick={() => setActiveView('checkin')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group relative"
      >
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
          <DoorOpen size={40} className="text-gray-700 group-hover:text-white transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Check In Management</h2>
        <p className="text-gray-500 text-sm text-center">Manage room assignments, check-ins, and house keeping statuses.</p>
      </button>

      {/* 5. Banquet (Coming Soon) */}
      <button 
        onClick={() => setActiveView('banquet')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Coming Soon
        </div>
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors opacity-50">
          <Utensils size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-400">Banquet</h2>
        <p className="text-gray-400 text-sm text-center">Manage event spaces and banquet reservations.</p>
      </button>

      {/* 5. Room Service (Coming Soon) */}
      <button 
        onClick={() => setActiveView('room_service')}
        className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Coming Soon
        </div>
        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors opacity-50">
          <BellRing size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-400">Room Service</h2>
        <p className="text-gray-400 text-sm text-center">Handle in-room dining and guest requests.</p>
      </button>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'bookings':
        return <BookingManager />;
      case 'reject_create':
        return <RejectCreateBooking />;
      case 'cancellations':
        return <CancellationRequestsManager />;
      case 'checkin':
        return <CheckInManagement />;
      case 'banquet':
      case 'room_service':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Coming Soon</h2>
            <p className="text-gray-500">This feature is currently under development.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          {activeView && (
            <button 
              onClick={() => setActiveView(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-600 font-medium"
            >
              <ArrowLeft size={20} />
              <span>Back to Grid</span>
            </button>
          )}
          {!activeView && (
            <h1 className="text-2xl font-bold tracking-tight text-black">
              M2N Reception Portal
            </h1>
          )}
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            Logged in as: {user?.name}
          </span>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-gray-600 hover:text-black font-medium transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto">
        {activeView ? (
          <div className="max-w-7xl mx-auto bg-white p-8 shadow-sm border border-gray-200 rounded-xl min-h-[80vh]">
            {renderActiveView()}
          </div>
        ) : (
          renderGrid()
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
