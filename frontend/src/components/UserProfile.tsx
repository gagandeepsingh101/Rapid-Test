import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Shield, LogOut, ArrowLeft, Info } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../api';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import { Tooltip } from 'react-tooltip';
import toast from 'react-hot-toast';

interface UserProfileProps {
  user: { id: string; name: string; email: string } | null;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        setProfile(response.data);
        setName(response.data.name);
        setEmail(response.data.email);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to fetch profile';
        setError(errorMsg);
        toast.error(errorMsg);
        onLogout();
      }
    };
    fetchUserProfile();
  }, [onLogout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await updateUserProfile({ name, email, password: password || undefined });
      setProfile(response.data.user);
      setPassword('');
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-light)] fade-in">
        <div className="card bg-white dark:bg-[var(--bg-light)] p-4 max-w-sm mx-auto text-center dark:glass">
          <p className="text-lg mb-4">User not found</p>
          <button
            onClick={onLogout}
            className="button-primary"
            aria-label="Back to login"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--bg-light)] fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center text-[var(--primary)] hover:text-[var(--secondary)] transition-all duration-200"
        aria-label="Go to dashboard"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Dashboard
      </button>
      <div className="card bg-white dark:bg-[var(--bg-light)] p-8 max-w-2xl mx-auto dark:glass">
        {error && (
          <div
            className="bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] px-4 py-2 rounded-lg mb-6 text-center fade-in"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[var(--primary)]/10 p-3 rounded-full transition-transform duration-300 hover:rotate-[360deg]">
            <User size={32} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">{profile.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold flex items-center">
                <Settings size={18} className="mr-2" />
                Account Settings
              </h3>
              <button data-tooltip-id="settings-tooltip" aria-label="Account settings info">
                <Info size={18} className="text-[var(--primary)]" />
              </button>
              <Tooltip id="settings-tooltip" content="Update your personal information" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-[0_0_10px_rgba(124,58,237,0.2)] dark:shadow-[0_0_10px_rgba(167,139,250,0.2)] hover:scale-[1.02]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-[0_0_10px_rgba(124,58,237,0.2)] dark:shadow-[0_0_10px_rgba(167,139,250,0.2)] hover:scale-[1.02]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">New Password (optional)</label>
                <input
                  type="password"
                  id="password"
                  className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-[0_0_10px_rgba(124,58,237,0.2)] dark:shadow-[0_0_10px_rgba(167,139,250,0.2)] hover:scale-[1.02]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <button
                type="submit"
                className="button-primary w-full"
                disabled={isLoading}
                aria-label="Save profile changes"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold flex items-center">
                <Bell size={18} className="mr-2" />
                Notifications
              </h3>
              <button data-tooltip-id="notifications-tooltip" aria-label="Notifications info">
                <Info size={18} className="text-[var(--primary)]" />
              </button>
              <Tooltip id="notifications-tooltip" content="Manage your notification preferences" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span>Push Notifications</span>
                <Switch
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                  className={`${pushNotifications ? 'bg-[var(--primary)]' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span className={`${pushNotifications ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform bg-white rounded-full transition-transform`} />
                </Switch>
              </div>
              <div className="flex justify-between items-center">
                <span>Email Notifications</span>
                <Switch
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                  className={`${emailNotifications ? 'bg-[var(--primary)]' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span className={`${emailNotifications ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform bg-white rounded-full transition-transform`} />
                </Switch>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold flex items-center">
                <Shield size={18} className="mr-2" />
                Privacy & Security
              </h3>
              <button data-tooltip-id="privacy-tooltip" aria-label="Privacy info">
                <Info size={18} className="text-[var(--primary)]" />
              </button>
              <Tooltip id="privacy-tooltip" content="View and manage your privacy settings" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span>Privacy Policy</span>
                <a href="/privacy" className="text-[var(--primary)] hover:underline">View</a>
              </div>
              <div className="flex justify-between items-center">
                <span>Terms of Service</span>
                <a href="/terms" className="text-[var(--primary)] hover:underline">View</a>
              </div>
              <div className="flex justify-between items-center">
                <span>Data & Storage</span>
                <a href="/data" className="text-[var(--primary)] hover:underline">Manage</a>
              </div>
            </div>
          </div>
          <button
            className="bg-[var(--error)] text-white py-2 px-6 rounded-xl hover:bg-[var(--error)]/80 transition-all duration-200 w-full flex items-center justify-center gap-2"
            onClick={onLogout}
            aria-label="Logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;