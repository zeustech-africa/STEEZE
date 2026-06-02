'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  amountRands: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  balanceRands: string;
  totalEarned: number;
  totalEarnedRands: string;
  totalWithdrawn: number;
  totalWithdrawnRands: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function WalletPage() {
  const { isAuthenticated } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const limit = 20;

  const getToken = () => localStorage.getItem('token');

  // Fetch wallet balance
  const fetchWallet = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      } else if (response.status === 404) {
        // No wallet yet - that's fine
        setWallet(null);
      } else {
        console.error('Failed to fetch wallet');
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (resetOffset = true) => {
    const token = getToken();
    if (!token) return;
    
    const currentOffset = resetOffset ? 0 : offset;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/wallet/transactions?limit=${limit}&offset=${currentOffset}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetOffset) {
          setTransactions(data.transactions);
          setOffset(limit);
        } else {
          setTransactions(prev => [...prev, ...data.transactions]);
          setOffset(currentOffset + data.transactions.length);
        }
        
        setHasMore(data.hasMore);
        setTotalTransactions(data.total);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [offset, limit]);

  // Fetch earnings summary
  const fetchSummary = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/wallet/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(prev => prev ? { ...prev, ...data } : data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), fetchTransactions(true), fetchSummary()]);
    setRefreshing(false);
  }, [fetchWallet, fetchTransactions, fetchSummary]);

  // Load more transactions
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions(false);
    }
  };

  // Initial load
  useEffect(() => {
    const token = getToken();
    if (isAuthenticated && token) {
      refreshAll();
    }
  }, [isAuthenticated, refreshAll]);

  // Get transaction icon and color
  const getTransactionInfo = (type: string, status: string) => {
    if (status === 'pending') {
      return { icon: Loader2, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Pending' };
    }
    if (status === 'failed' || status === 'cancelled') {
      return { icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Failed' };
    }
    
    switch (type) {
      case 'earning':
        return { icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Earning' };
      case 'withdrawal':
        return { icon: TrendingDown, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Withdrawal' };
      case 'refund':
        return { icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Refund' };
      default:
        return { icon: Wallet, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: type };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to view your wallet</h2>
          <p className="text-gray-400">Please log in to access your earnings and transaction history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">My Wallet</h1>
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

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 shadow-xl">
          <p className="text-purple-100 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-white">
            {wallet?.balanceRands ? `R${wallet.balanceRands}` : 'R0.00'}
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href="/wallet/withdraw"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
            >
              Withdraw Funds
            </Link>
            <button
              onClick={refreshAll}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition"
            >
              Refresh Balance
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-gray-400 text-sm">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {wallet?.totalEarnedRands ? `R${wallet.totalEarnedRands}` : 'R0.00'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <p className="text-gray-400 text-sm">Total Withdrawn</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {wallet?.totalWithdrawnRands ? `R${wallet.totalWithdrawnRands}` : 'R0.00'}
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            <p className="text-gray-400 text-sm">Total: {totalTransactions} transactions</p>
          </div>
          
          {error && (
            <div className="p-4 text-center text-red-400">
              {error}
              <button onClick={refreshAll} className="ml-2 text-purple-400 underline">
                Try again
              </button>
            </div>
          )}
          
          {loading && transactions.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-gray-500 text-sm">Earnings will appear here as you grow</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-800">
                {transactions.map((tx) => {
                  const { icon: Icon, color, bgColor, label } = getTransactionInfo(tx.type, tx.status);
                  const isPositive = tx.type === 'earning' || tx.type === 'refund';
                  
                  return (
                    <div key={tx.id} className="p-4 hover:bg-gray-800/50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor} ${color}`}>
                                {label}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(tx.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-orange-500'}`}>
                            {isPositive ? '+' : '-'}R{tx.amountRands}
                          </p>
                          {tx.status === 'pending' && (
                            <p className="text-xs text-yellow-500">Pending</p>
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
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Load More
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}