"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Wallet, TrendingUp, Clock, CheckCircle, XCircle, 
  AlertCircle, Plus, Download, Loader2, Eye, EyeOff,
  Calendar, DollarSign, Banknote
} from "lucide-react";

interface WalletData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingPayout: number;
  lastPayoutAt: string | null;
  hasBankAccount: boolean;
  bankVerified: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  failedReason: string | null;
  bankName: string;
  accountNumber: string;
}

export default function CreatorWalletPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    accountType: "checking"
  });
  
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "payouts">("overview");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchPayouts();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/earnings/wallet`);
      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error("Fetch wallet error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/earnings/transactions`);
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Fetch transactions error:", error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payout/history`);
      const data = await response.json();
      if (response.ok) {
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error("Fetch payouts error:", error);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankForm.accountHolder || !bankForm.bankName || !bankForm.accountNumber) {
      alert("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/bank/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bankForm)
      });
      
      const data = await response.json();
      if (response.ok) {
        setShowBankModal(false);
        fetchWalletData();
        alert("Bank account saved. Awaiting verification.");
      } else {
        alert(data.error || "Failed to save bank account");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 500) {
      alert("Minimum withdrawal is R500");
      return;
    }
    
    if (wallet && amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/payout/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      if (response.ok) {
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        fetchWalletData();
        fetchPayouts();
        alert("Withdrawal request submitted for review");
      } else {
        alert(data.error || "Failed to request withdrawal");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pending</span>;
      case "processing": return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Processing</span>;
      case "completed": return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Completed</span>;
      case "failed": return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Failed</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold hover:underline">
            ← Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Creator Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-gold/20 to-gold/5 rounded-2xl p-6 border border-gold/30 mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <p className="text-white/50 text-sm">Available Balance</p>
              <p className="text-4xl md:text-5xl font-bold text-gold">
                {wallet ? formatCurrency(wallet.balance) : "R0.00"}
              </p>
              <div className="flex gap-4 mt-2 text-white/40 text-sm">
                <span>Total Earned: {wallet ? formatCurrency(wallet.totalEarned) : "R0.00"}</span>
                <span>Total Withdrawn: {wallet ? formatCurrency(wallet.totalWithdrawn) : "R0.00"}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {!wallet?.hasBankAccount ? (
                <button
                  onClick={() => setShowBankModal(true)}
                  className="px-5 py-2.5 bg-gold/20 text-gold rounded-xl hover:bg-gold/30 transition-all flex items-center gap-2"
                >
                  <Banknote size={18} /> Add Bank Account
                </button>
              ) : !wallet?.bankVerified ? (
                <div className="px-5 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} /> Awaiting Verification
                </div>
              ) : (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={!wallet?.balance || wallet.balance < 500}
                  className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Withdraw Funds
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {["overview", "transactions", "payouts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-gold border-b-2 border-gold"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-gold" />
                Earnings Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/40 text-sm">Content Sales</p>
                  <p className="text-white text-xl font-semibold">R0.00</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Subscriptions</p>
                  <p className="text-white text-xl font-semibold">R0.00</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Tips</p>
                  <p className="text-white text-xl font-semibold">R0.00</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gold" />
                Recent Transactions
              </h2>
              {transactions.length === 0 ? (
                <p className="text-white/40 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{tx.description}</p>
                        <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                      </div>
                      <p className={tx.amount > 0 ? "text-green-400" : "text-red-400"}>
                        {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            {transactions.length === 0 ? (
              <p className="text-white/40 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                    </div>
                    <p className={tx.amount > 0 ? "text-green-400" : "text-red-400"}>
                      {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            {payouts.length === 0 ? (
              <p className="text-white/40 text-center py-8">No payout requests yet</p>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{formatCurrency(payout.amount)}</p>
                      <p className="text-white/40 text-xs">
                        {payout.bankName} • {payout.accountNumber}
                      </p>
                      <p className="text-white/30 text-xs">{formatDate(payout.requestedAt)}</p>
                    </div>
                    <div className="text-right">
                      {getPayoutStatusBadge(payout.status)}
                      {payout.failedReason && (
                        <p className="text-red-400 text-xs mt-1">{payout.failedReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-white text-xl font-bold mb-4">Add Bank Account</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Account Holder Name *"
                value={bankForm.accountHolder}
                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Bank Name *"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Account Number *"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Branch Code"
                value={bankForm.branchCode}
                onChange={(e) => setBankForm({ ...bankForm, branchCode: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <select
                value={bankForm.accountType}
                onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="business">Business Account</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBankModal(false)} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg">
                Cancel
              </button>
              <button onClick={handleSaveBankAccount} disabled={submitting} className="flex-1 px-4 py-2 bg-gold text-black rounded-lg font-semibold disabled:opacity-50">
                {submitting ? "Saving..." : "Save Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-white text-xl font-bold mb-4">Request Withdrawal</h2>
            <p className="text-white/60 text-sm mb-4">
              Available balance: {wallet ? formatCurrency(wallet.balance) : "R0.00"}
              <br />
              Minimum withdrawal: R500
            </p>
            <input
              type="number"
              placeholder="Amount (R)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg">
                Cancel
              </button>
              <button onClick={handleRequestWithdrawal} disabled={submitting} className="flex-1 px-4 py-2 bg-gold text-black rounded-lg font-semibold disabled:opacity-50">
                {submitting ? "Processing..." : "Request Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}