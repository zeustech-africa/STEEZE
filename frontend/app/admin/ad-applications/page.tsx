'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Megaphone, CheckCircle, XCircle, Eye, Loader2, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminAdApplicationsPage() {
  const { token, isAuthenticated, user } = useAuthStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchApplications = useCallback(async () => {
    if (!token || !isAdmin) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`${API_URL}/api/admin/ad-applications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setApplications(data.applications || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchApplications();
    } else if (isAuthenticated && !isAdmin) {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, fetchApplications]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`${API_URL}/api/admin/ad-applications/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchApplications();
      } else {
        const data = await response.json();
        setError(data.error || 'Approval failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    
    setActionLoading(id);
    try {
      const response = await fetch(`${API_URL}/api/admin/ad-applications/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.ok) {
        setSelectedApp(null);
        setRejectReason('');
        fetchApplications();
      } else {
        const data = await response.json();
        setError(data.error || 'Rejection failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Admin access required</p>
          <Link href="/admin/login" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Ad Applications</h1>
              <p className="text-gray-400 text-sm">{total} total applications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-xl">
            <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No applications found</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-800">
              {applications.map((app: any) => (
                <div key={app.id} className="p-4 hover:bg-gray-800/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          app.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-semibold text-white">{app.companyName}</p>
                      <p className="text-sm text-gray-400">{app.email}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-500">
                          Campaign: <span className="text-gray-300">{app.campaignName}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Budget: <span className="text-green-400">${(app.budget / 100).toFixed(2)}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Placement: <span className="text-gray-300">{app.placement}</span> | CPM: ${(app.cpm / 100).toFixed(2)}
                        </p>
                      </div>
                      {app.rejectionReason && (
                        <p className="mt-2 text-sm text-red-400 bg-red-500/5 rounded p-2">
                          Reason: {app.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition flex items-center gap-1"
                          >
                            {actionLoading === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedApp(app.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-white mb-4">Reject Application</h2>
              <p className="text-gray-400 text-sm mb-3">
                Please provide a reason for rejection. This will be shown to the applicant.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                rows={3}
                placeholder="Reason for rejection..."
              />
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => { setSelectedApp(null); setRejectReason(''); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedApp)}
                  disabled={!rejectReason.trim() || actionLoading === selectedApp}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition flex items-center gap-2"
                >
                  {actionLoading === selectedApp && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}