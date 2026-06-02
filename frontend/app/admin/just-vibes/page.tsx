'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  RefreshCw,
  Search,
  Eye,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface JustVibesUser {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  lastSession: {
    id: string;
    startTime: string;
    expiryTime: string;
    status: string;
  } | null;
}

interface Summary {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  approved: { label: 'Approved', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  expired: { label: 'Expired', color: 'text-gray-500', bgColor: 'bg-gray-500/10' }
};

export default function AdminJustVibesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [users, setUsers] = useState<JustVibesUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action modals
  const [selectedUser, setSelectedUser] = useState<JustVibesUser | null>(null);
  const [actionType, setActionType] = useState<'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const limit = 20;
  const isAdmin = isAuthenticated && token !== null;

  // Fetch users
  const fetchUsers = useCallback(async (resetOffset = true) => {
    if (!token || !isAdmin) return;
    
    const currentOffset = resetOffset ? 0 : offset;
    if (resetOffset) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_URL}/api/admin/just-vibes/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetOffset) {
          setUsers(data.users);
          setOffset(data.users.length);
        } else {
          setUsers(prev => [...prev, ...data.users]);
          setOffset(currentOffset + data.users.length);
        }
        
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        setSummary(data.summary);
      } else if (response.status === 403) {
        setError('Admin access required');
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isAdmin, offset, statusFilter, searchQuery]);

  // Execute action
  const executeAction = async (userId: string, action: 'approve' | 'reject') => {
    if (!token) return;
    
    setActionLoading(true);
    
    try {
      const url = `${API_URL}/api/admin/just-vibes/${userId}/${action}`;
      let body: Record<string, string> = {};
      
      if (action === 'reject') {
        body = { rejectionReason };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });
      
      if (response.ok) {
        setSelectedUser(null);
        setActionType(null);
        setRejectionReason('');
        setOffset(0);
        fetchUsers(true);
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Error ${action} user:`, err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const refreshAll = () => {
    setRefreshing(true);
    setOffset(0);
    fetchUsers(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && token && isAdmin) {
      fetchUsers(true);
    }
  }, [isAuthenticated, token, isAdmin]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to access admin panel</h2>
          <p className="text-gray-400">Please log in with your admin account.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Just VIBES Approvals</h1>
          </div>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm text-gray-300">Refresh</span>
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{summary.pending}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-500">{summary.approved}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-500">{summary.rejected}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{summary.total}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={refreshAll} className="text-red-400 underline mt-2">Try again</button>
          </div>
        )}

        {/* Users List */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Just VIBES Users</h2>
            <p className="text-gray-400 text-sm">Total: {total} users</p>
          </div>
          
          {loading && users.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-800">
                {users.map((user) => {
                  const statusInfo = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <div key={user.id} className="p-4 hover:bg-gray-800/50 transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString('en-ZA')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <p className="text-white font-medium">{user.email}</p>
                          </div>
                          {user.rejectionReason && (
                            <p className="text-sm text-red-400 mt-1">Reason: {user.rejectionReason}</p>
                          )}
                          {user.approvedAt && (
                            <p className="text-sm text-gray-500 mt-1">
                              Approved: {new Date(user.approvedAt).toLocaleString('en-ZA')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => executeAction(user.id, 'approve')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('reject');
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {hasMore && (
                <div className="p-4 border-t border-gray-800 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {actionType === 'reject' && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reject Just VIBES Account</h2>
            <p className="text-gray-400 mb-4">
              Rejecting account for: <span className="text-white">{selectedUser.email}</span>
            </p>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={3}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedUser.id, 'reject')}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}