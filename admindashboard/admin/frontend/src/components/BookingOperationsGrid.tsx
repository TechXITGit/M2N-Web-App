import React, { useState } from 'react';
import { Calendar, FilePlus2, Utensils, BellRing, ArrowLeft } from 'lucide-react';
import BookingManager from './BookingManager';
import RejectCreateBooking from './RejectCreateBooking';

const BookingOperationsGrid: React.FC = () => {
  const [activeView, setActiveView] = useState<string | null>(null);

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mt-4">
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
        <h2 className="text-xl font-bold text-gray-800">Create, Cancel and Review</h2>
        <p className="text-gray-500 text-sm text-center">Create walk-in bookings or cancel and review requests.</p>
      </button>

      {/* 3. Banquet (Coming Soon) */}
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

      {/* 4. Room Service (Coming Soon) */}
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
      case 'banquet':
      case 'room_service':
        return (
          <div className="flex flex-col items-center justify-center h-[50vh]">
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
    <div className="w-full">
      {activeView && (
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => setActiveView(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-600 font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Grid</span>
          </button>
        </div>
      )}
      
      {activeView ? (
        <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-gray-200 min-h-[60vh]">
          {renderActiveView()}
        </div>
      ) : (
        renderGrid()
      )}
    </div>
  );
};

export default BookingOperationsGrid;
