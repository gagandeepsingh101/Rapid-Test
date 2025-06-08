import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { getTestHistory } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HistoryItem {
  id: string;
  date: string;
  result: string;
  imageUrl: string;
  confidence: number;
  controlIntensity: number;
  testIntensity: number;
}

const TestHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getTestHistory();
        setHistory(response.data);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to fetch test history';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
        Test History
      </h2>
      {error && (
        <div
          className="bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] px-4 py-2 rounded-lg mb-4 max-w-4xl mx-auto text-center fade-in"
          role="alert"
        >
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-[var(--primary)]"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center max-w-4xl mx-auto fade-in">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">You haven't taken any tests yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
          {history.map(item => (
            <div
              key={item.id}
              className="card bg-white dark:bg-[var(--bg-light)] p-4 dark:glass cursor-pointer"
              onClick={() => navigate(`/result/${item.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/result/${item.id}`)}
              aria-label={`View test result from ${formatDate(item.date)}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <img src={item.imageUrl} alt="Test strip" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(item.date)}</div>
                  <div className={`text-lg font-semibold ${
                    item.result === 'Positive' ? 'text-[var(--secondary)]' :
                    item.result === 'Negative' ? 'text-[var(--error)]' :
                    item.result === 'Unclear' ? 'text-[var(--accent)]' :
                    'text-gray-500'
                  }`}>
                    {item.result}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Confidence: {(item.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestHistory;