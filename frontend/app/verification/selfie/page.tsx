'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SelfieContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!userId) {
      router.push('/signup/vibes');
    }
  }, [userId, router]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setError('');
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        captureSelfie();
      }
    }, 1000);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture selfie');
        return;
      }

      const previewUrl = URL.createObjectURL(blob);
      setSelfiePreview(previewUrl);
      setSelfieCaptured(true);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }

      await uploadSelfie(blob);
    }, 'image/png');
  };

  const uploadSelfie = async (blob: Blob) => {
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('selfie', blob, 'selfie.png');
    formData.append('userId', userId || '');

    try {
      const response = await fetch(`${API_URL}/api/verification/upload-selfie`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          router.push(`/verify-status?userId=${userId}`);
        }, 3000);
      } else {
        setError(data.error || 'Failed to upload selfie');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retakeSelfie = () => {
    setSelfieCaptured(false);
    setSelfiePreview(null);
    startCamera();
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-gold/10 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-gold text-2xl font-bold mb-2">STEEZE</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Live Selfie Verification</h1>
          <p className="text-white/60">Take a live selfie to verify your identity</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          {/* Camera Container */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-6">
            {!selfieCaptured ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-8xl font-bold text-gold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}
                {!cameraActive && !countdown && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <div className="text-5xl mb-3">📷</div>
                    <p className="text-white/60 text-sm mb-4">Click "Start Camera" to begin</p>
                    <button
                      onClick={startCamera}
                      className="bg-gradient-to-r from-gold to-gold-dark text-black px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </>
            ) : (
              <img
                src={selfiePreview || ''}
                alt="Selfie preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                ✓ Selfie uploaded successfully! Redirecting...
              </p>
            </div>
          )}

          {!selfieCaptured ? (
            <div className="space-y-3">
              <button
                onClick={startCountdown}
                disabled={!cameraActive || countdown > 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
              >
                {countdown > 0 ? `Capturing in ${countdown}...` : '📸 Capture Selfie'}
              </button>
              
              {cameraActive && (
                <button
                  onClick={() => {
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                      setCameraActive(false);
                    }
                  }}
                  className="w-full py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all"
                >
                  Restart Camera
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={retakeSelfie}
                disabled={loading}
                className="w-full py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all disabled:opacity-50"
              >
                Retake Selfie
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-gold font-semibold mb-2 text-sm">Instructions:</h3>
            <ul className="text-white/50 text-xs space-y-1 list-disc list-inside">
              <li>Ensure good lighting on your face</li>
              <li>Remove sunglasses or anything covering your face</li>
              <li>Look directly at the camera</li>
              <li>Your selfie will be reviewed by admin alongside your ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelfieVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <SelfieContent />
    </Suspense>
  );
}
