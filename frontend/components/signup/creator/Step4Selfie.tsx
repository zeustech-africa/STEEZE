"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Camera, RefreshCw, CheckCircle, Loader2 } from "lucide-react";

interface Step4SelfieProps {
  data: any;
  updateData: (data: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  markComplete: () => void;
}

export default function Step4Selfie({ data, updateData, onSubmit, onBack, loading, markComplete }: Step4SelfieProps) {
  const [selfie, setSelfie] = useState<string | null>(data.selfie || null);
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setSelfie(imageData);
      updateData({ ...data, selfie: imageData });
      markComplete();
      stopCamera();
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          captureSelfie();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const retakeSelfie = () => {
    setSelfie(null);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleSubmit = () => {
    if (selfie) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center">
        {!selfie ? (
          <div className="text-center">
            {cameraActive ? (
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="rounded-2xl border-2 border-gold w-full max-w-md" style={{ transform: "scaleX(-1)" }} />
                <canvas ref={canvasRef} className="hidden" />
                {countdown !== null && (<div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl"><span className="text-8xl font-bold text-gold animate-pulse">{countdown}</span></div>)}
                <button onClick={startCountdown} disabled={countdown !== null} className="mt-4 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full flex items-center gap-2 mx-auto hover:shadow-lg disabled:opacity-50">
                  <Camera size={18} /> Take Selfie
                </button>
              </div>
            ) : (
              <button onClick={startCamera} className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full flex items-center gap-2 mx-auto">
                <Camera size={18} /> Activate Camera
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="relative inline-block"><img src={selfie} alt="Selfie" className="rounded-2xl border-2 border-green-500 w-64 h-64 object-cover" /><CheckCircle className="absolute bottom-2 right-2 text-green-500 bg-black rounded-full" size={28} /></div>
            <div className="flex gap-4 mt-4 justify-center"><button onClick={retakeSelfie} className="px-4 py-2 border border-white/30 text-white rounded-full hover:border-gold transition-all flex items-center gap-2"><RefreshCw size={16} /> Retake</button></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg"><p className="text-white/70 text-sm text-center">Your selfie will be reviewed by admin alongside your ID. This ensures STEEZE remains a platform with real creators and no fake accounts.</p></div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={onBack} className="px-8 py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all flex items-center gap-2"><ChevronLeft size={18} /> Back</button>
        <button onClick={handleSubmit} disabled={!selfie || loading} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}