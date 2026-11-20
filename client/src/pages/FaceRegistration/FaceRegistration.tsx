import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, User, Save, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const FaceRegistration: React.FC = () => {
  const { user } = useAuth();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [livenessScore, setLivenessScore] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [streamActive, setStreamActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cameraEnabled && !capturedImage) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [cameraEnabled]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn('Webcam unavailable');
      setStreamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const toggleCamera = () => {
    if (cameraEnabled) {
      stopWebcam();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && streamActive) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopWebcam();
      }
    } else setErrorMsg('Camera is unavailable. Connect a camera or upload a real image to continue.');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setQualityScore(null);
    setLivenessScore(null);
    setSuccessMsg('');
    setErrorMsg('');
    if (cameraEnabled) {
      startWebcam();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterFace = async () => {
    if (!capturedImage || !user) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/recognition/register-face', {
        userId: user.id,
        image: capturedImage
      });

      if (res.data.success) {
        setQualityScore(typeof res.data.qualityScore === 'number' ? res.data.qualityScore : null);
        setLivenessScore(typeof res.data.livenessScore === 'number' ? res.data.livenessScore : null);
        setSuccessMsg('Face profile and 128-d embedding saved successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Face registration failed. Please ensure your face is clearly visible.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-brand-accent text-xs font-mono mb-1">
          <Sparkles className="w-4 h-4" />
          <span>BIOMETRIC ENROLLMENT MODULE</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Face Profile Registration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Capture multi-angle webcam snapshots to train your 128-dimensional facial embedding vector.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webcam Capture Box */}
        <div className="p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webcam Photo Capture</h3>
            {!capturedImage && (
              <button
                onClick={toggleCamera}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${
                  cameraEnabled
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {cameraEnabled ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                <span>{cameraEnabled ? 'Turn Off' : 'Turn On'}</span>
              </button>
            )}
          </div>

          <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-dark-border flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraEnabled && streamActive ? 'block' : 'hidden'}`}
                />
                {(!cameraEnabled || !streamActive) && (
                  <div className="text-center p-6 space-y-3">
                    {cameraEnabled ? (
                      <>
                        <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">Position your face within the frame with clear illumination.</p>
                      </>
                    ) : (
                      <>
                        <CameraOff className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">Camera is off. Turn it on to capture a live frame.</p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            {capturedImage ? (
              <button
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            ) : (
              <button
                onClick={handleCapture}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Frame</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Quality Meter & Embedding Status */}
        <div className="p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Assessment & Save</h3>

          {capturedImage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Face Blurriness & Illumination</span>
                  <span className="font-mono font-bold text-emerald-400">{qualityScore === null ? 'PENDING' : `${(qualityScore * 100).toFixed(0)}%`}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(qualityScore || 0) * 100}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Liveness estimate</span>
                  <span className="font-mono font-bold text-brand-accent">{livenessScore === null ? 'NOT REPORTED' : `${(livenessScore * 100).toFixed(0)}%`}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-brand-accent rounded-full" style={{ width: `${(livenessScore || 0) * 100}%` }} />
                </div>
              </div>

              <button
                onClick={handleRegisterFace}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{isProcessing ? 'Generating Embedding...' : 'Save Face Vector to Profile'}</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-12">Capture or upload a face photo to analyze quality.</p>
          )}
        </div>
      </div>
    </div>
  );
};
