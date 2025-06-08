import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Camera, Upload, Home, User, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';

// Components
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import TestCamera from './components/TestCamera';
import TestHistory from './components/TestHistory';
import TestResult from './components/TestResult';
import UserProfile from './components/UserProfile';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const { theme, toggleTheme } = useTheme();

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    toast.success('Logged in successfully!', { style: { background: theme === 'dark' ? '#1E293B' : '#FFF', color: theme === 'dark' ? '#E2E8F0' : '#0F172A' } });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully!', { style: { background: theme === 'dark' ? '#1E293B' : '#FFF', color: theme === 'dark' ? '#E2E8F0' : '#0F172A' } });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col transition-all duration-300">
      <Toaster position="top-right" />
      {isLoggedIn && (
        <header className="sticky top-0 z-20 bg-[var(--bg-light)] shadow-md dark:glass fade-in">
          <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] cursor-pointer"
              onClick={() => window.location.href = '/dashboard'}
            >
              Rapid Test
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ripple"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={20} className="text-[var(--primary)]" /> : <Sun size={20} className="text-[var(--secondary)]" />}
              </button>
              <button
                className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <nav className="md:hidden bg-[var(--bg-light)] dark:glass px-4 py-2 transition-all duration-300">
              <ul className="space-y-2">
                {[
                  { path: '/dashboard', icon: Home, label: 'Home' },
                  { path: '/camera', icon: Camera, label: 'New Test' },
                  { path: '/history', icon: Upload, label: 'Test History' },
                  { path: '/profile', icon: User, label: 'Profile' },
                ].map(({ path, icon: Icon, label }) => (
                  <li
                    key={path}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 fade-in"
                    onClick={() => { window.location.href = path; setIsMenuOpen(false); }}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </li>
                ))}
                <li
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 fade-in"
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </li>
              </ul>
            </nav>
          )}
        </header>
      )}
      <main className="flex-1 p-6 fade-in">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/camera"
            element={isLoggedIn ? <TestCamera /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={isLoggedIn ? <TestHistory /> : <Navigate to="/login" />}
          />
          <Route
            path="/result/:id"
            element={isLoggedIn ? <TestResult /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={isLoggedIn ? <UserProfile user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;