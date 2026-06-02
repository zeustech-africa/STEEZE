'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Flag,
  Loader2,
  RefreshCw,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface QueueItem {
  id: string;
  postId: string;
  priority: number;
  assignedTo: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  post: {
    id: string;
    title: string;
    mediaType: string;
    caption: string;
    creator: {
      id: string;
      artistName: string | null;
      fullName: string | null;
      email: string;
    };
  };
}

interface HistoryItem {
  id: string;
  postId: string;
  adminId: string;
  action: string;
  notes: string | null;
  previousStatus: string | null;
  newStatus: string;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    artistName: string | null;
    fullName: string | null;
  };
  post: {
    id: string;
    title: string;
    mediaType: string;
  };
}

interface QueueStats {
  byStatus: { pending: number; in_review: number; approved: number; rejected: number };
  byPriority: { normal: number; high: number; urgent: number };
  totalPending: number;
  averageWaitMinutes: number;
}

interface SummaryData {
  period: string;
  totalActions: number;
  actionBreakdown: Record<string, number>;
  uniqueAdmins: number;
  uniquePosts: number;
  averageActionsPerDay: number;
  dailyActivity: Array<{ date: string; count: number }>;
  queueStats: QueueStats;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Priority configuration
const PRIORITY_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Normal', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  1: { label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  2: { label: 'Urgent', color: 'text-red-400', bgColor: 'bg-red-500/10' }
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  in_review: { label: 'In Review', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  approved: { label: 'Approved', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: 'bg-red-500/10' }
};

// Action labels
const ACTION_LABELS: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  reassigned: 'Reassigned',
  bulk_approved: 'Bulk Approved',
  bulk_rejected: 'Bulk Rejected',
  bulk_assigned: 'Bulk Assigned',
  priority_updated: 'Priority Updated',
  auto_approved: 'Auto Approved'
};

export default function AdminReviewPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'summary'>('queue');
  
  // Queue state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueOffset, setQueueOffset] = useState(0);
  const [queueHasMore, setQueueHasMore] = useState(false);
  const [queueTotal, setQueueTotal] = useState(0);
  
  // Queue filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  
  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Action modals
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'assign' | 'priority' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignAdminId, setAssignAdminId] = useState('');
  const [newPriority, setNewPriority] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  
  // History state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyActionFilter, setHistoryActionFilter] = useState('');
  const [historyDateStart, setHistoryDateStart] = useState('');
  const [historyDateEnd, setHistoryDateEnd] = useState('');
  
  // Summary state
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  const limit = 20;
  const isAdmin = user?.userType === 'admin';

  // ============================================================
  // QUEUE FUNCTIONS
  // ============================================================

  const fetchQueue = useCallback(async (resetOffset = true) => {
    if (!isAuthenticated || !isAdmin) return;
    
    const currentOffset = resetOffset ? 0 : queueOffset;
    setQueueLoading(resetOffset);
    
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());
      params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assignedFilter) params.append('assignedTo', assignedFilter);
      
      const response = await fetch(`${API_URL}/api/admin/review/queue?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetOffset) {
          setQueueItems(data.items);
          setQueueOffset(limit);
          setSelectedItems(new Set());
        } else {
          setQueueItems(prev => [...prev, ...data.items]);
          setQueueOffset(currentOffset + data.items.length);
        }
        
        setQueueHasMore(data.hasMore);
        setQueueTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setQueueLoading(false);
    }
  }, [isAuthenticated, isAdmin, queueOffset, limit, statusFilter, priorityFilter, assignedFilter]);

  const fetchQueueStats = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/review/queue/stats`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueueStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching queue stats:', err);
    }
  }, [isAuthenticated, isAdmin]);

  // ============================================================
  // HISTORY FUNCTIONS
  // ============================================================

  const fetchHistory = useCallback(async (resetOffset = true) => {
    if (!isAuthenticated || !isAdmin) return;
    
    const currentOffset = resetOffset ? 0 : historyOffset;
    setHistoryLoading(resetOffset);
    
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());
      if (historyActionFilter) params.append('action', historyActionFilter);
      if (historyDateStart) params.append('startDate', historyDateStart);
      if (historyDateEnd) params.append('endDate', historyDateEnd);
      
      const response = await fetch(`${API_URL}/api/admin/review/history?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetOffset) {
          setHistoryItems(data.history);
          setHistoryOffset(limit);
        } else {
          setHistoryItems(prev => [...prev, ...data.history]);
          setHistoryOffset(currentOffset + data.history.length);
        }
        
        setHistoryHasMore(data.hasMore);
        setHistoryTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, isAdmin, historyOffset, limit, historyActionFilter, historyDateStart, historyDateEnd]);

  // ============================================================
  // SUMMARY FUNCTIONS
  // ============================================================

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    
    setSummaryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/review/summary?days=30`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  // ============================================================
  // ACTION FUNCTIONS
  // ============================================================

  const executeAction = async (postId: string, action: string, body: any = {}) => {
    if (!isAuthenticated) return;
    
    setActionLoading(true);
    
    try {
      let url = `${API_URL}/api/admin/review/queue/${postId}/${action}`;
      if (action === 'priority') url = `${API_URL}/api/admin/review/queue/${postId}/priority`;
      
      const method = action === 'priority' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setSelectedPostId(null);
        setActionType(null);
        setRejectionReason('');
        setAssignAdminId('');
        fetchQueue(true);
        fetchQueueStats();
        if (activeTab === 'history') fetchHistory(true);
        if (activeTab === 'summary') fetchSummary();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${action}`);
      }
    } catch (err) {
      console.error(`Error ${action}:`, err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const executeBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedItems.size === 0) return;
    
    const postIds = Array.from(selectedItems);
    setBulkActionLoading(true);
    
    try {
      const body: any = { postIds };
      if (action === 'reject') {
        const reason = prompt('Enter rejection reason for all selected items:');
        if (!reason) {
          setBulkActionLoading(false);
          return;
        }
        body.rejectionReason = reason;
      }
      
      const response = await fetch(`${API_URL}/api/admin/review/bulk/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setSelectedItems(new Set());
        fetchQueue(true);
        fetchQueueStats();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to bulk ${action}`);
      }
    } catch (err) {
      console.error(`Error bulk ${action}:`, err);
      alert('Network error. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectItem = (postId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === queueItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queueItems.map(item => item.postId)));
    }
  };

  const loadMoreQueue = () => {
    if (queueHasMore && !queueLoading) {
      fetchQueue(false);
    }
  };

  const loadMoreHistory = () => {
    if (historyHasMore && !historyLoading) {
      fetchHistory(false);
    }
  };

  const refreshAll = () => {
    fetchQueue(true);
    fetchQueueStats();
    if (activeTab === 'history') fetchHistory(true);
    if (activeTab === 'summary') fetchSummary();
  };

  // Initial loads
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchQueue(true);
      fetchQueueStats();
      fetchHistory(true);
      fetchSummary();
    }
  }, [isAuthenticated, isAdmin]);

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchQueue(true);
    }
  }, [statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && activeTab === 'history') {
      fetchHistory(true);
    }
  }, [historyActionFilter, historyDateStart, historyDateEnd, activeTab]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
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
            <Flag className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Content Review</h1>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-300">Refresh</span>
          </button>
        </div>

        {/* Queue Stats Cards */}
        {queueStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{queueStats.byStatus.pending}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">In Review</p>
              <p className="text-2xl font-bold text-blue-500">{queueStats.byStatus.in_review}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Avg Wait Time</p>
              <p className="text-2xl font-bold text-white">{queueStats.averageWaitMinutes} min</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Queue</p>
              <p className="text-2xl font-bold text-white">{queueStats.totalPending}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'queue'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Review Queue
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'history'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            History & Audit
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'summary'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Summary Dashboard
          </button>
        </div>

        {/* ============================================================ */}
        {/* QUEUE TAB */}
        {/* ============================================================ */}
        {activeTab === 'queue' && (
          <>
            {/* Filters */}
            <div className="bg-gray-900 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">All</option>
                    <option value="0">Normal</option>
                    <option value="1">High</option>
                    <option value="2">Urgent</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setPriorityFilter('');
                    setAssignedFilter('');
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
              <div className="bg-purple-600/20 border border-purple-500 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-white text-sm">{selectedItems.size} items selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeBulkAction('approve')}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => executeBulkAction('reject')}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Review Queue</h2>
                  <p className="text-gray-400 text-sm">Total: {queueTotal} items</p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  {selectedItems.size === queueItems.length && queueItems.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              {queueLoading && queueItems.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : queueItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No items in queue</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-800">
                    {queueItems.map((item) => {
                      const priorityInfo = PRIORITY_CONFIG[item.priority];
                      const statusInfo = STATUS_CONFIG[item.status];
                      const isSelected = selectedItems.has(item.postId);
                      
                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-800/50 transition">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleSelectItem(item.postId)}
                              className="mt-1"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-purple-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.submittedAt).toLocaleDateString('en-ZA')}
                                </span>
                              </div>
                              <p className="text-white font-medium">{item.post.caption?.substring(0, 100) || 'Untitled'}</p>
                              <p className="text-sm text-gray-400">
                                By: {item.post.creator.artistName || item.post.creator.fullName || item.post.creator.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                Type: {item.post.mediaType}
                              </p>
                              {item.assignedTo && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Assigned to: {item.assignedTo}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedPostId(item.postId);
                                      setActionType('assign');
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPostId(item.postId);
                                      setActionType('priority');
                                      setNewPriority(item.priority);
                                    }}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition"
                                  >
                                    Priority
                                  </button>
                                  <button
                                    onClick={() => executeAction(item.postId, 'approve', {})}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPostId(item.postId);
                                      setActionType('reject');
                                    }}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/post/${item.postId}`}
                                target="_blank"
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {queueHasMore && (
                    <div className="p-4 border-t border-gray-800 text-center">
                      <button
                        onClick={loadMoreQueue}
                        disabled={queueLoading}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
                      >
                        {queueLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* HISTORY TAB */}
        {/* ============================================================ */}
        {activeTab === 'history' && (
          <>
            {/* History Filters */}
            <div className="bg-gray-900 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Action</label>
                  <select
                    value={historyActionFilter}
                    onChange={(e) => setHistoryActionFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">All Actions</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="bulk_approved">Bulk Approved</option>
                    <option value="bulk_rejected">Bulk Rejected</option>
                    <option value="priority_updated">Priority Updated</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={historyDateStart}
                    onChange={(e) => setHistoryDateStart(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={historyDateEnd}
                    onChange={(e) => setHistoryDateEnd(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    setHistoryActionFilter('');
                    setHistoryDateStart('');
                    setHistoryDateEnd('');
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
                <p className="text-gray-400 text-sm">Total: {historyTotal} records</p>
              </div>
              
              {historyLoading && historyItems.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No history records found</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-800">
                    {historyItems.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-800/50 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleString('en-ZA')}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                                {ACTION_LABELS[item.action] || item.action}
                              </span>
                            </div>
                            <p className="text-white font-medium">
                              {item.post.title || item.post.id}
                            </p>
                            <p className="text-sm text-gray-400">
                              Admin: {item.admin.email}
                            </p>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                            )}
                            {item.previousStatus && item.newStatus && (
                              <p className="text-sm text-gray-500 mt-1">
                                Status: {item.previousStatus} → {item.newStatus}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/post/${item.postId}`}
                            target="_blank"
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition"
                          >
                            View Post
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {historyHasMore && (
                    <div className="p-4 border-t border-gray-800 text-center">
                      <button
                        onClick={loadMoreHistory}
                        disabled={historyLoading}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
                      >
                        {historyLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* SUMMARY TAB */}
        {/* ============================================================ */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {summaryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : summaryData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Actions (30 days)</p>
                    <p className="text-2xl font-bold text-white">{summaryData.totalActions}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Unique Admins</p>
                    <p className="text-2xl font-bold text-white">{summaryData.uniqueAdmins}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Unique Posts Reviewed</p>
                    <p className="text-2xl font-bold text-white">{summaryData.uniquePosts}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Avg Actions/Day</p>
                    <p className="text-2xl font-bold text-white">{summaryData.averageActionsPerDay}</p>
                  </div>
                </div>

                {/* Action Breakdown */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Action Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(summaryData.actionBreakdown).map(([action, count]) => (
                      <div key={action} className="text-center p-3 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-purple-500">{count}</p>
                        <p className="text-sm text-gray-400">{ACTION_LABELS[action] || action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Activity Chart */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily Activity (Last 30 Days)</h3>
                  <div className="space-y-2">
                    {summaryData.dailyActivity.slice(0, 20).map((day) => {
                      const maxCount = Math.max(...summaryData.dailyActivity.map(d => d.count), 1);
                      const widthPercent = Math.min(100, (day.count / maxCount) * 100);
                      return (
                        <div key={day.date} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24">
                            {new Date(day.date).toLocaleDateString('en-ZA')}
                          </span>
                          <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-white w-8">{day.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Queue Stats Summary */}
                {summaryData.queueStats && (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Queue Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-500">{summaryData.queueStats.byStatus.pending}</p>
                        <p className="text-sm text-gray-400">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-500">{summaryData.queueStats.byStatus.in_review}</p>
                        <p className="text-sm text-gray-400">In Review</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{summaryData.queueStats.byStatus.approved}</p>
                        <p className="text-sm text-gray-400">Approved</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{summaryData.queueStats.byStatus.rejected}</p>
                        <p className="text-sm text-gray-400">Rejected</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-xl">
                <p className="text-gray-400">No summary data available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {actionType === 'reject' && selectedPostId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reject Content</h2>
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
                  setSelectedPostId(null);
                  setActionType(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedPostId, 'reject', { rejectionReason })}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {actionType === 'assign' && selectedPostId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Assign Reviewer</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Admin ID</label>
              <input
                type="text"
                value={assignAdminId}
                onChange={(e) => setAssignAdminId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Enter admin user ID"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedPostId(null);
                  setActionType(null);
                  setAssignAdminId('');
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedPostId, 'assign', { adminId: assignAdminId })}
                disabled={!assignAdminId.trim() || actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Modal */}
      {actionType === 'priority' && selectedPostId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Update Priority</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Priority Level</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="0">Normal</option>
                <option value="1">High</option>
                <option value="2">Urgent</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedPostId(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(selectedPostId, 'priority', { priority: newPriority })}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
