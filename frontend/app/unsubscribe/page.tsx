"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Mail, Shield } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No unsubscribe token provided. Please use the link from your email.");
      return;
    }

    processUnsubscribe();
  }, [token]);

  const processUnsubscribe = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/optout/unsubscribe?token=${token}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.message || "You have been successfully unsubscribed.");
      } else {
        setStatus("error");
        setMessage(data.message || "Invalid or expired unsubscribe link.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again or contact support.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
              <Mail className="text-gold" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Processing your request...</h1>
            <p className="text-white/50">Please wait while we update your preferences.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-green-500 mb-2">Unsubscribed Successfully</h1>
            <p className="text-white/70 mb-4">{message}</p>
            <p className="text-white/50 text-sm mb-6">You will no longer receive marketing emails from STEEZE.</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/settings/consent")}
                className="w-full py-2 bg-gold text-black rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Manage All Preferences
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-2 border border-white/30 text-white rounded-full hover:border-gold transition-all"
              >
                Return to Home
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-red-500 mb-2">Unsubscribe Failed</h1>
            <p className="text-white/70 mb-4">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/settings/consent")}
                className="w-full py-2 bg-gold text-black rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Manage Preferences
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-2 border border-white/30 text-white rounded-full hover:border-gold transition-all"
              >
                Return to Home
              </button>
            </div>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio</p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
              <Mail className="text-gold" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
            <p className="text-white/50">Please wait.</p>
          </div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}