import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Image, RefreshCw, Upload, ArrowLeft, Share2, CheckCircle, XCircle, AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { createTestResult } from '../api';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import toast from 'react-hot-toast';

const TestCamera: React.FC = () => {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // Store actual file
  const [result, setResult] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!webcamRef.current) {
      setCameraError('Camera not available');
      toast.error('Camera not available');
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot({ width: 1920, height: 1080 });
      if (!imageSrc) {
        setCameraError('Failed to capture photo. Please try again.');
        toast.error('Failed to capture photo');
        return;
      }

      // Convert base64 to File object
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const file = new File([ab], 'test-strip.jpg', { type: mimeString });

      setPhotoData(imageSrc);
      setImageFile(file); // Store File object
      setHasPhoto(true);
      setResult(null);
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Error capturing photo');
      toast.error('Error capturing photo');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCameraError('No file selected');
      toast.error('No file selected');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setCameraError('Please upload an image file (JPEG/PNG)');
      toast.error('Please upload an image file (JPEG/PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCameraError('Image size too large (max 5MB)');
      toast.error('Image size too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoData(reader.result);
        setImageFile(file); // Store original File object
        setHasPhoto(true);
        setResult(null);
      }
    };
    reader.onerror = () => {
      setCameraError('Failed to load image');
      toast.error('Failed to load image');
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setPhotoData(null);
    setImageFile(null); // Clear File object
    setHasPhoto(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzePhoto = async () => {
    setIsProcessing(true);
    setCameraError('');
    setProgress(0);

    if (!imageFile) {
      setCameraError('No image file available');
      toast.error('No image file available');
      setIsProcessing(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile); // Use actual File object
      formData.append('date', new Date().toISOString());
      formData.append('userId', localStorage.getItem('userId') || '');

      const apiResponse = await createTestResult(formData);
      setProgress(100);
      const resultData = {
        id: apiResponse.data.id,
        date: apiResponse.data.date,
        result: apiResponse.data.result,
        imageUrl: apiResponse.data.imageUrl,
        confidence: apiResponse.data.confidence,
        message: apiResponse.data.message,
        color: apiResponse.data.color,
        controlIntensity: apiResponse.data.controlIntensity,
        testIntensity: apiResponse.data.testIntensity,
      };
      setResult(resultData);
      toast.success('Analysis complete!');
      navigate(`/result/${resultData.id}`);
    } catch (err: any) {
      console.log('Analyze photo error:', err.message);
      let errorMsg = 'Failed to analyze photo. Please try again.';
      if (err.message?.includes('Unexpected field')) {
        errorMsg = 'Invalid image upload. Please try again or contact support.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

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
        Test Strip Analysis
      </h2>
      {cameraError && (
        <div
          className="bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)] px-4 py-2 rounded-lg mb-4 max-w-2xl mx-auto text-center fade-in"
          role="alert"
        >
          {cameraError}
        </div>
      )}
      {result && (
        <div
          className={`card bg-white dark:bg-[var(--bg-light)] p-6 mb-6 max-w-2xl mx-auto border-l-4 border-${
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Control Line Intensity: {(result.controlIntensity * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test Line Intensity: {(result.testIntensity * 100).toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <button
                onClick={shareResult}
                className="button-primary flex items-center gap-2"
                aria-label="Share test result"
              >
                <Share2 size={18} />
                Share Result
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card bg-white dark:bg-[var(--bg-light)] p-6 max-w-2xl mx-auto dark:glass">
        <div className="relative">
          {!hasPhoto ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.8}
                width="100%"
                height="auto"
                className="rounded-2xl"
                videoConstraints={{
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                  facingMode: 'environment',
                }}
                onUserMediaError={() => {
                  setCameraError('Error: Could not access camera. Please check permissions.');
                  toast.error('Camera permission denied');
                }}
              />
            </>
          ) : (
            <img
              src={photoData || ''}
              alt="Test strip"
              className="w-full h-auto rounded-2xl"
            />
          )}
        </div>
        {isProcessing && (
          <div className="mt-4 progress-bar max-w-2xl mx-auto fade-in">
            <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="flex justify-center gap-4 mt-6">
          {!hasPhoto ? (
            <>
              <button
                className="button-primary flex items-center gap-2"
                data-tooltip-id="capture-tooltip"
                onClick={takePhoto}
                aria-label="Capture photo"
              >
                <Camera size={24} />
                Capture Photo
              </button>
              <Tooltip id="capture-tooltip" content="Take a high-quality photo of your test strip" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
              <button
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-2 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
                data-tooltip-id="upload-tooltip"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload image"
              >
                <Upload size={24} />
                Upload Image
              </button>
              <Tooltip id="upload-tooltip" content="Upload a JPEG/PNG image (max 5MB)" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-2 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
                onClick={retakePhoto}
                aria-label="Retake photo"
              >
                <RefreshCw size={20} />
                Retake
              </button>
              <button
                className="button-primary flex items-center gap-2"
                onClick={analyzePhoto}
                disabled={isProcessing}
                data-tooltip-id="analyze-tooltip"
                aria-label="Analyze image"
              >
                {isProcessing ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <Image size={20} />
                    Analyze Image
                  </>
                )}
              </button>
              <Tooltip id="analyze-tooltip" content="Analyze the test strip for instant results" place="top" className="bg-[var(--primary)] text-white rounded-lg" />
            </>
          )}
        </div>
      </div>
      <div className="mt-6 max-w-2xl mx-auto text-gray-600 dark:text-gray-400 fade-in">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-lg font-semibold">For best results:</p>
          <button data-tooltip-id="tips-tooltip" aria-label="View tips">
            <Info size={20} className="text-[var(--primary)]" />
          </button>
          <Tooltip
            id="tips-tooltip"
            content="Follow these tips for accurate test strip analysis"
            place="top"
            className="bg-[var(--primary)] text-white rounded-lg"
          />
        </div>
        <ul className="list-disc pl-6 text-base space-y-1">
          <li>Ensure bright, even lighting (current time: 07:52 AM IST, use artificial light if needed)</li>
          <li>Place the 100mm x 6mm test strip on a dark, flat surface</li>
          <li>Wait 3-5 minutes after applying the sample</li>
          <li>Hold the camera steady</li>
        </ul>
      </div>
    </div>
  );
};

export default TestCamera;