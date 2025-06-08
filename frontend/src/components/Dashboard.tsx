import React from 'react';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-[var(--bg-light)] fade-in">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center text-[var(--primary)] hover:text-[var(--secondary)] transition-all duration-200"
        aria-label="Go to home"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Home
      </button>
      <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
        Rapid Test Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="card bg-white dark:bg-[var(--bg-light)] p-6 dark:glass">
          <div className="flex justify-center mb-4">
            <div className="transition-transform duration-300 hover:rotate-[360deg]">
              <Camera size={40} className="text-[var(--primary)]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">Take a New Test</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
            Use your camera to take a photo of your test strip for instant analysis
          </p>
          <button
            className="button-primary mt-4 w-full"
            onClick={() => navigate('/camera')}
            aria-label="Start a new test"
          >
            Start Test
          </button>
        </div>
        <div className="card bg-white dark:bg-[var(--bg-light)] p-6 dark:glass">
          <div className="flex justify-center mb-4">
            <div className="transition-transform duration-300 hover:rotate-[360deg]">
              <Upload size={40} className="text-[var(--primary)]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">View Test History</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
            Access your previous test results and track your history
          </p>
          <button
            className="button-primary mt-4 w-full"
            onClick={() => navigate('/history')}
            aria-label="View test history"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;