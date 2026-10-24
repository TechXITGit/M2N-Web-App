import { create } from 'zustand';

interface DashboardState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  pendingCategoryCreationForHotel: string | null;
  setPendingCategoryCreation: (hotelId: string | null) => void;
  
  newlyCreatedCategoryId: string | null;
  setNewlyCreatedCategoryId: (id: string | null) => void;
}

const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'hotels',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  pendingCategoryCreationForHotel: null,
  setPendingCategoryCreation: (hotelId) => set({ pendingCategoryCreationForHotel: hotelId }),
  
  newlyCreatedCategoryId: null,
  setNewlyCreatedCategoryId: (id) => set({ newlyCreatedCategoryId: id }),
}));

export default useDashboardStore;
