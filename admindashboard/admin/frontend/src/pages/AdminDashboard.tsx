import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import HotelManager from '../components/HotelManager';
import GlobalCategoryManager from '../components/GlobalCategoryManager';
import ArchivedCategoryManager from '../components/ArchivedCategoryManager';
import SuperAdminManager from '../components/SuperAdminManager';
import BookingOperationsGrid from '../components/BookingOperationsGrid';
import CancellationRequestsManager from '../components/CancellationRequestsManager';
import useDashboardStore from '../store/dashboardStore';
import axios from 'axios';
import { Bell } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useDashboardStore();
  const [pendingCancellations, setPendingCancellations] = useState(0);

  const isSuperAdmin = user?.role === 'superadmin';
  // If user.permissions is undefined, it's a legacy session before permissions were added, so grant full access by default.
  // New users with no permissions will have an empty array [].
  const hasPerm = (perm: string) => isSuperAdmin || !user?.permissions || user.permissions.includes(perm);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      // If the current tab isn't allowed for this user, switch to the first allowed tab

      const isAllowed = (tab: string) => {
        if (tab === 'admins' || tab === 'archives') return isSuperAdmin;
        if (tab === 'cancellations') return true; // all admins can see cancellations
        return hasPerm(tab);
      };

      if (!isAllowed(activeTab)) {
        if (isSuperAdmin) setActiveTab('admins');
        else if (hasPerm('hotels')) setActiveTab('hotels');
        else if (hasPerm('global_categories')) setActiveTab('global_categories');
        else if (hasPerm('bookings')) setActiveTab('bookings');
        else setActiveTab('cancellations');
      }
    }
  }, [user, navigate, activeTab, setActiveTab]);

  useEffect(() => {
    if (user && hasPerm('bookings')) {
      const fetchPending = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/cancellation-requests`, {
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold tracking-tight">
            {user?.role === 'superadmin' ? 'TechX Super Admin' : 'M2N Admin Portal'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full truncate">
              Logged in as: {user?.name}
            </span>
          </div>
        </div>
        <div className="flex-1 py-4">
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'admins' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Administrators
            </button>
          )}
          {hasPerm('hotels') && (
            <button
              onClick={() => setActiveTab('hotels')}
              className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'hotels' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Hotel & Room Management
            </button>
          )}
          {hasPerm('global_categories') && (
            <button
              onClick={() => setActiveTab('global_categories')}
              className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'global_categories' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Room Categories
            </button>
          )}
          {hasPerm('bookings') && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'bookings' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Bookings & Inventory
            </button>
          )}
          <button
            onClick={() => setActiveTab('cancellations')}
            className={`w-full text-left px-6 py-3 font-medium transition-colors flex justify-between items-center ${activeTab === 'cancellations' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <span>Cancellation Requests</span>
            {pendingCancellations > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                <Bell size={12} className="mr-1" />
                {pendingCancellations}
              </span>
            )}
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('archives')}
                className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeTab === 'archives' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                Archived
              </button>
            </>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full btn-outline justify-center">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-10 max-w-6xl mx-auto">
          {isSuperAdmin && (
            <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'admins' ? 'block' : 'hidden'}`}>
              <SuperAdminManager />
            </div>
          )}
          {hasPerm('hotels') && (
            <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'hotels' ? 'block' : 'hidden'}`}>
              <HotelManager />
            </div>
          )}
          {hasPerm('global_categories') && (
            <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'global_categories' ? 'block' : 'hidden'}`}>
              <GlobalCategoryManager />
            </div>
          )}
          {hasPerm('bookings') && (
            <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'bookings' ? 'block' : 'hidden'}`}>
              <BookingOperationsGrid />
            </div>
          )}
          <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'cancellations' ? 'block' : 'hidden'}`}>
            <CancellationRequestsManager />
          </div>
          {isSuperAdmin && (
            <>
              <div className={`bg-white p-8 shadow-sm border border-gray-200 rounded-lg ${activeTab === 'archives' ? 'block' : 'hidden'}`}>
                <ArchivedCategoryManager />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
