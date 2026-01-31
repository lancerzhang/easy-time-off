import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MyLeaves from './pages/MyLeaves';
import TeamCalendar from './pages/TeamCalendar';
import Directory from './pages/Directory';
import UserCalendar from './pages/UserCalendar';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { ToastProvider } from './components/ToastContext';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Check for session (simple demo persistence)
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('easy_timeoff_user');
    if (sessionUser) {
        setUser(JSON.parse(sessionUser));
    }
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
      sessionStorage.setItem('easy_timeoff_user', JSON.stringify(u));
  };

  const handleLogout = () => {
      setUser(null);
      sessionStorage.removeItem('easy_timeoff_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <Router>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/my-leaves" element={<MyLeaves currentUser={user} />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/calendar/:teamId" element={<TeamCalendar />} />
            <Route path="/user/:userId" element={<UserCalendar />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<div className="p-8">Page under construction</div>} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;