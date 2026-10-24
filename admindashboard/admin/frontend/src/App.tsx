import React, { useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import useAuthStore from './store/authStore';

const App: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
      }, 15 * 60 * 1000); // 15 minutes
    }
  }, [user, logout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    if (user) {
      resetTimer();
      events.forEach((event) => window.addEventListener(event, resetTimer));
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            !user ? <Login /> : 
            user.role === 'superadmin' ? <Navigate to="/superadmin" /> : 
            <Navigate to="/admin" />
          } 
        />
        <Route 
          path="/superadmin" 
          element={user?.role === 'superadmin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin" 
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
