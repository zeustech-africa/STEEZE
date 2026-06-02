'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';
import { useJustVibes } from '@/hooks/useJustVibes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function JustVibesTimer() {
  const router = useRouter();
  const { token, session, logout, updateSession, isAuthenticated } = useJustVibes();
  const [remainingMinutes, setRemainingMinutes] = useState<number>(session?.remainingMinutes || 0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [inCooldown, setInCooldown] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const checkSessionStatus = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/just-vibes/session/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        if (!data.valid && !data.inCooldown) {
          // Session expired and no cooldown - logout
          logout();
          router.push('/just-vibes/login?expired=true');
        } else if (data.inCooldown) {
          setInCooldown(true);
          setCooldownMinutes(data.cooldownMinutes);
          setRemainingMinutes(0);
        } else {
          setInCooldown(false);
          setRemainingMinutes(data.remainingMinutes);
          if (session) {
            updateSession({ ...session, remainingMinutes: data.remainingMinutes });
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [token, logout, router, session, updateSession]);

  // Countdown timer
  useEffect(() => {
    if (!isAuthenticated) return;

    checkSessionStatus();

    const interval = setInterval(() => {
      if (inCooldown) {
        if (cooldownMinutes > 0) {
          setCooldownMinutes(prev => prev - 1);
        } else {
          setInCooldown(false);
          checkSessionStatus();
        }
      } else if (remainingMinutes > 0 || remainingSeconds > 0) {
        if (remainingSeconds === 0) {
          setRemainingMinutes(prev => prev - 1);
          setRemainingSeconds(59);
        } else {
          setRemainingSeconds(prev => prev - 1);
        }

        // Show warning at 5 minutes remaining
        if (remainingMinutes === 5 && remainingSeconds === 0) {
          setShowWarning(true);
        }

        // Auto logout at 0
        if (remainingMinutes === 0 && remainingSeconds === 1) {
          logout();
          router.push('/just-vibes/login?expired=true');
        }
      } else {
        checkSessionStatus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingMinutes, remainingSeconds, inCooldown, cooldownMinutes, checkSessionStatus, logout, router, isAuthenticated]);

  // Initial load from stored session
  useEffect(() => {
    if (session?.remainingMinutes) {
      setRemainingMinutes(session.remainingMinutes);
    }
  }, [session]);

  if (!isAuthenticated) return null;

  if (inCooldown) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-300">Cooldown:</span>
          <span className="text-sm font-mono text-yellow-500">
            {Math.floor(cooldownMinutes / 60)}h {cooldownMinutes % 60}m
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${remainingMinutes <= 5 ? 'text-red-500 animate-pulse' : 'text-purple-500'}`} />
          <span className="text-sm text-gray-300">Session:</span>
          <span className={`text-sm font-mono ${remainingMinutes <= 5 ? 'text-red-500 font-bold' : 'text-white'}`}>
            {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
          </span>
          <button
            onClick={() => logout()}
            className="ml-2 p-1 hover:bg-gray-800 rounded transition"
            title="Logout"
          >
            <LogOut className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Session Ending Soon</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Your Just VIBES session will expire in {remainingMinutes} minutes.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              After expiry, you'll need to wait 3 hours before your next session.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}