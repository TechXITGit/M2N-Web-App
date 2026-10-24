import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  token: string;
}

interface AuthState {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => {
  const userInfo = localStorage.getItem('adminUserInfo');
  const initialUser = userInfo ? JSON.parse(userInfo) : null;

  return {
    user: initialUser,
    login: (userData) => {
      localStorage.setItem('adminUserInfo', JSON.stringify(userData));
      set({ user: userData });
    },
    logout: () => {
      localStorage.removeItem('adminUserInfo');
      set({ user: null });
    },
  };
});

export default useAuthStore;
