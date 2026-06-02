'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
}

interface User {
  id: string;
  email: string;
  artistName: string | null;
  fullName: string | null;
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  amountRands: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  rejectionReason: string | null;
  adminNotes: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  user: User;
  bankAccount: BankAccount;
}

interface StatusCount {
  status: string;
  count: number;
}

interface Summary {
  totalAmountCents: number;
  totalAmountRands: string;
  totalRequests: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; actions: string[] }> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    actions: ['approve', 'reject'],
  },
  approved: {
    label: 'Approved',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    actions: ['process', 'reject'],
  },
  processing: {
    label: 'Processing',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    actions: ['complete'],
  },
  completed: {
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    actions: [],
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    actions: [],
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    actions: [],
  },
};

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export default function AdminWithdrawalsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Action modals
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'complete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingWithdrawal, setViewingWithdrawal] = useState<Withdrawal | null>(null);

  const limit = 20;

  // Check if user is admin
  const isAdmin = user?.userType === 'admin';

  // Fetch withdrawals
  const fetchWithdrawals = useCallback(
    async (resetOffset = true) => {
      const token = getToken();
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
        if (searchQuery) params.append('userId', searchQuery);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_URL}/api/admin/withdrawals?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();

          if (resetOffset) {
            setWithdrawals(data.withdrawals);
            setOffset(limit);
          } else {
            setWithdrawals((prev) => [...prev, ...data.withdrawals]);
            setOffset(currentOffset + data.withdrawals.length);
          }

          setHasMore(data.pagination.hasMore);
          setTotal(data.pagination.total);
          setSummary(data.summary);
          setStatusCounts(data.statusCounts);
        } else if (response.status === 403) {
          setError('Admin access required');
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.error || 'Failed to load withdrawals');
        }
      } catch (err) {
        console.error('Error fetching withdrawals:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin, offset, limit, statusFilter, searchQuery, startDate, endDate],
  );

  // Refresh all data
  const refreshAll = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchWithdrawals(true);
  }, [fetchWithdrawals]);

  // Load more
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchWithdrawals(false);
    }
  };

  // Execute action on withdrawal
  const executeAction = async (withdrawalId: string, action: string) => {
    const token = getToken();
    if (!token) return;

    setActionLoading(true);

    try {
      const url = `${API_URL}/api/admin/withdrawals/${withdrawalId}/${action}`;
      let body: Record<string, string> = {};

      if (action === 'reject') {
        body = { rejectionReason, adminNotes };
      } else if (action === 'complete') {
        body = { transactionReference, adminNotes };
      } else if (action === 'approve' || action === 'process') {
        body = { adminNotes };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        // Reset modal state
        setSelectedWithdrawal(null);
        setActionType(null);
        setRejectionReason('');
        setTransactionReference('');
        setAdminNotes('');
        // Refresh list
        refreshAll();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || `Failed to ${action} withdrawal`);
      }
    } catch (err) {
      console.error(`Error ${action} withdrawal:`, err);
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open action modal
  const openActionModal = (withdrawal: Withdrawal, action: 'reject' | 'complete') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setRejectionReason('');
    setTransactionReference('');
    setAdminNotes('');
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, statusFilter, searchQuery, startDate, endDate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdmin && !loading && !refreshing) {
        fetchWithdrawals(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, loading, refreshing, fetchWithdrawals]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
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
            <Wallet className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Requests</p>
              <p className="text-2xl font-bold text-white">{summary.totalRequests}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-white">R{summary.totalAmountRands}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                {statusCounts.find((s) => s.status === 'pending')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <button
              onClick={() => refreshAll()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={refreshAll} className="text-red-400 underline mt-2">
              Try again
            </button>
          </div>
        )}

        {/* Withdrawals List */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Withdrawal Requests</h2>
            <p className="text-gray-400 text-sm">Total: {total} requests</p>
          </div>

          {loading && withdrawals.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No withdrawal requests found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-800">
                {withdrawals.map((withdrawal) => {
                  const statusInfo = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;
                  const actions = statusInfo.actions;

                  return (
                    <div key={withdrawal.id} className="p-4 hover:bg-gray-800/50 transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(withdrawal.createdAt).toLocaleDateString('en-ZA')}
                            </span>
                          </div>
                          <p className="font-semibold text-white">
                            {withdrawal.user.artistName || withdrawal.user.fullName || withdrawal.user.email}
                          </p>
                          <p className="text-sm text-gray-400">
                            {withdrawal.bankAccount.bankName} - {withdrawal.bankAccount.accountHolder}
                          </p>
                          <p className="text-sm text-gray-500">
                            Account: {withdrawal.bankAccount.accountNumber} | Branch:{' '}
                            {withdrawal.bankAccount.branchCode}
                          </p>
                          {withdrawal.rejectionReason && (
                            <p className="text-sm text-red-400 mt-1">Reason: {withdrawal.rejectionReason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">R{withdrawal.amountRands}</p>
                          <div className="flex gap-2 mt-2 justify-end">
                            <button
                              onClick={() => setViewingWithdrawal(withdrawal)}
                              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-300" />
                            </button>
                            {actions.includes('approve') && (
                              <button
                                onClick={() => executeAction(withdrawal.id, 'approve')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                            )}
                            {actions.includes('process') && (
                              <button
                                onClick={() => executeAction(withdrawal.id, 'process')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition"
                              >
                                <Clock className="w-4 h-4" />
                                Process
                              </button>
                            )}
                            {actions.includes('complete') && (
                              <button
                                onClick={() => openActionModal(withdrawal, 'complete')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition"
                              >
                                <DollarSign className="w-4 h-4" />
                                Complete
                              </button>
                            )}
                            {actions.includes('reject') && (
                              <button
                                onClick={() => openActionModal(withdrawal, 'reject')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            )}
                          </div>
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
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition disabled:opacity-50"
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
      {actionType === 'reject' && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reject Withdrawal</h2>
            <p className="text-gray-400 mb-4">
              Withdrawal for R{selectedWithdrawal.amountRands} from{' '}
              {selectedWithdrawal.user.artistName || selectedWithdrawal.user.email}
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
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedWithdrawal.id, 'reject')}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {actionType === 'complete' && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Complete Withdrawal</h2>
            <p className="text-gray-400 mb-4">
              Mark withdrawal of R{selectedWithdrawal.amountRands} as completed
            </p>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Transaction Reference</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Bank transaction ID / Reference..."
              />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedWithdrawal.id, 'complete')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Withdrawal Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">User</p>
                <p className="text-white">
                  {viewingWithdrawal.user.artistName ||
                    viewingWithdrawal.user.fullName ||
                    viewingWithdrawal.user.email}
                </p>
                <p className="text-sm text-gray-500">{viewingWithdrawal.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-white">R{viewingWithdrawal.amountRands}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[viewingWithdrawal.status]?.bgColor} ${STATUS_CONFIG[viewingWithdrawal.status]?.color}`}
                >
                  {STATUS_CONFIG[viewingWithdrawal.status]?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Bank Account</p>
                <p className="text-white">{viewingWithdrawal.bankAccount.bankName}</p>
                <p className="text-white">Holder: {viewingWithdrawal.bankAccount.accountHolder}</p>
                <p className="text-gray-400 text-sm">Account: {viewingWithdrawal.bankAccount.accountNumber}</p>
                <p className="text-gray-400 text-sm">Branch: {viewingWithdrawal.bankAccount.branchCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Requested</p>
                <p className="text-white">
                  {new Date(viewingWithdrawal.createdAt).toLocaleString('en-ZA')}
                </p>
              </div>
              {viewingWithdrawal.processedAt && (
                <div>
                  <p className="text-sm text-gray-400">Processed</p>
                  <p className="text-white">
                    {new Date(viewingWithdrawal.processedAt).toLocaleString('en-ZA')}
                  </p>
                </div>
              )}
              {viewingWithdrawal.rejectionReason && (
                <div>
                  <p className="text-sm text-gray-400">Rejection Reason</p>
                  <p className="text-red-400">{viewingWithdrawal.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingWithdrawal(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}