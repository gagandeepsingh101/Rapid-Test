import React, { useState, useEffect } from 'react';
import { Share2, CheckCircle, XCircle, AlertTriangle, HelpCircle, ArrowLeft, Info } from 'lucide-react';
import { getTestResult } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import toast from 'react-hot-toast';

interface TestResultData {
  id: string;
  date: string;
  result: string;
  imageUrl: string;
  confidence: number;
  message: string;
  color: string;
  controlIntensity: number;
  testIntensity: number;
}

const TestResult: React.FC = () => {
  const [result, setResult] = useState<TestResultData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) {
        setError('Invalid test ID');
        toast.error('Invalid test ID');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getTestResult(id);
        setResult(response.data);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to fetch test result';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  const shareResult = () => {
    if (!result) return;
    const shareText = `Rapid Test Result\nDate: ${new Date(result.date).toLocaleDateString()}\nResult: ${result.result}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nView details: ${result.imageUrl}`;
    if (navigator.share) {
      navigator.share({
        title: 'Rapid Test Result',
        text: shareText,
        url: result.imageUrl,
      }).catch(() => toast.error('Failed to share result'));
    } else {
      navigator.clipboard.writeText(shareText).then(() => toast.success('Result copied to clipboard!'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="  flex items-center justify-center p-6 bg-[var(--bg-light)] fade-in">
        <svg
          className="animate-spin h-8 w-8 text-[var(--primary)]"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-light)] fade-in">
        <div className="card bg-white dark:bg-[var(--bg-light)] p-6 max-w-md mx-auto text-center dark:glass">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <button
            onClick={() => navigate('/history')}
            className="button-primary"
            aria-label="Back to history"
          >
            Back to Test History
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--bg-light)] fade-in">
      <button
        onClick={() => navigate('/history')}
        className="mb-6 flex items-center text-[var(--primary)] hover:text-[var(--secondary)] transition-all duration-200"
        aria-label="Go to test history"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Test History
      </button>
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
        Test Result
      </h2>
      <div
        className={`card bg-white dark:bg-[var(--bg-light)] p-6 max-w-2xl mx-auto border-l-4 border-${
          result.color === 'green' ? '[var(--secondary)]' :
          result.color === 'red' ? '[var(--error)]' :
          result.color === 'yellow' ? '[var(--accent)]' :
          'gray-500'
        } dark:glass fade-in`}
      >
        <div className="flex items-center gap-4 mb-4">
          {result.result === 'Positive' && <CheckCircle size={32} className="text-[var(--secondary)]" />}
          {result.result === 'Negative' && <XCircle size={32} className="text-[var(--error)]" />}
          {result.result === 'Unclear' && <AlertTriangle size={32} className="text-[var(--accent)]" />}
          {result.result === 'Invalid' && <HelpCircle size={32} className="text-gray-500" />}
          <div>
            <h3 className="text-xl font-bold">{result.result}</h3>
            <p className="text-gray-600 dark:text-gray-400">{result.message}</p>
          </div>
        </div>
        <img
          src={result.imageUrl}
          alt="Test strip"
          className="w-full h-auto rounded-2xl mb-4 transition-all duration-300 hover:scale-[1.02]"
        />
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Date: {formatDate(result.date)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Control Line Intensity: {(result.controlIntensity * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Test Line Intensity: {(result.testIntensity * 100).toFixed(2)}%</p>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={shareResult}
            className="button-primary flex items-center gap-2"
            data-tooltip-id="share-tooltip"
            aria-label="Share test result"
          >
            <Share2 size={18} />
            Share Result
          </button>
          <Tooltip id="share-tooltip" content="Share your test result via link or copy to clipboard" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
          <div className="flex items-center gap-2">
            <button data-tooltip-id="result-info-tooltip" aria-label="Test result info">
              <Info size={18} className="text-[var(--primary)]" />
            </button>
            <Tooltip
              id="result-info-tooltip"
              content="Confidence and intensity values are derived from image analysis. Consult a healthcare professional for medical advice."
              place="top"
              className="bg-[var(--primary)] text-white rounded-lg max-w-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResult;