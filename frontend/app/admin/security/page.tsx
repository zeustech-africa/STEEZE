"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Bot, Globe, Power, Terminal, History, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SecurityDashboard {
  rateLimitHits: number;
  botDetections: number;
  suspiciousLogins: number;
  activeSessions: number;
}

interface IpRule {
  id: string;
  ipAddress: string;
  type: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  targetType: string;
  targetId: string;
  details?: any;
  createdAt: string;
}

const SecurityPage = () => {
  const [security, setSecurity] = useState<SecurityDashboard | null>(null);
  const [ipRules, setIpRules] = useState<IpRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddIp, setShowAddIp] = useState(false);
  const [newIp, setNewIp] = useState({ ipAddress: "", type: "blacklist", reason: "" });
  const [showKillSwitch, setShowKillSwitch] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [secRes, ipRes, auditRes] = await Promise.all([
        fetch("/api/admin/security/dashboard", { headers }),
        fetch("/api/admin/ip-rules", { headers }),
        fetch("/api/admin/audit-logs?limit=50", { headers }),
      ]);
      const [secData, ipData, auditData] = await Promise.all([secRes.json(), ipRes.json(), auditRes.json()]);
      if (secData.success) setSecurity(secData.security);
      if (ipData.success) setIpRules(ipData.rules || []);
      if (auditData.success) setAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error("Security fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const addIpRule = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/ip-rules", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newIp),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddIp(false);
        setNewIp({ ipAddress: "", type: "blacklist", reason: "" });
        fetchAll();
      }
    } catch (err) {
      console.error("Failed to add IP rule:", err);
    }
  };

  const deleteIpRule = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/ip-rules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchAll();
    } catch (err) {
      console.error("Failed to delete IP rule:", err);
    }
  };

  const triggerKillSwitch = async (action: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/kill-switch", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Kill switch activated: ${action}`);
        setShowKillSwitch(false);
      }
    } catch (err) {
      console.error("Kill switch failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="text-gold" size={28} /> Security Monitoring
            </h1>
            <p className="text-white/50 mt-1">Real-time threat detection and incident response</p>
          </div>
          <Link
            href="/incident-response"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-sm font-medium border border-gold/30 transition"
          >
            <ExternalLink size={14} /> Incident Response Plan
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-8 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Security Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="text-yellow-400" size={24} />
                <span className="text-2xl font-bold text-white">{security?.rateLimitHits || 0}</span>
              </div>
              <p className="text-white/50 text-sm">Rate Limit Hits (24h)</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Bot className="text-red-400" size={24} />
                <span className="text-2xl font-bold text-white">{security?.botDetections || 0}</span>
              </div>
              <p className="text-white/50 text-sm">Bot Detections (24h)</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Globe className="text-orange-400" size={24} />
                <span className="text-2xl font-bold text-white">{security?.suspiciousLogins || 0}</span>
              </div>
              <p className="text-white/50 text-sm">Suspicious Logins (24h)</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Terminal className="text-blue-400" size={24} />
                <span className="text-2xl font-bold text-white">{security?.activeSessions || 0}</span>
              </div>
              <p className="text-white/50 text-sm">Active Sessions</p>
            </div>
          </div>

          {/* Kill Switch */}
          <div className="glass-card rounded-xl p-6 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Power className="text-red-400" size={18} /> Emergency Kill Switch
                </h2>
                <p className="text-white/50 text-sm mt-1">Immediately lock down the platform in case of a security emergency.</p>
              </div>
              <button
                onClick={() => setShowKillSwitch(true)}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium border border-red-500/30 transition"
              >
                Activate Kill Switch
              </button>
            </div>
            {showKillSwitch && (
              <div className="mt-4 p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                <p className="text-white/70 text-sm mb-3 font-semibold">⚠️ This will affect ALL users. Choose the mode:</p>
                <div className="flex gap-3">
                  <button onClick={() => triggerKillSwitch("read-only")} className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm border border-yellow-500/30 transition">
                    Read-Only Mode
                  </button>
                  <button onClick={() => triggerKillSwitch("full-maintenance")} className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm border border-red-500/30 transition">
                    Full Maintenance
                  </button>
                  <button onClick={() => setShowKillSwitch(false)} className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-sm border border-white/10 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* IP Blacklist/Whitelist */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Globe size={18} className="text-gold" /> IP Rules
              </h2>
              <button
                onClick={() => setShowAddIp(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-sm border border-gold/30 transition"
              >
                <Plus size={14} /> Add Rule
              </button>
            </div>

            {showAddIp && (
              <div className="mb-4 p-4 bg-white/5 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="IP Address (e.g. 192.168.1.1)"
                  value={newIp.ipAddress}
                  onChange={(e) => setNewIp({ ...newIp, ipAddress: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50 transition"
                />
                <div className="flex gap-3">
                  <select
                    value={newIp.type}
                    onChange={(e) => setNewIp({ ...newIp, type: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                  >
                    <option value="blacklist" className="bg-black">Blacklist</option>
                    <option value="whitelist" className="bg-black">Whitelist</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={newIp.reason}
                    onChange={(e) => setNewIp({ ...newIp, reason: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addIpRule} className="px-4 py-1.5 rounded-lg bg-gold/20 text-gold text-sm border border-gold/30 hover:bg-gold/30 transition">Save</button>
                  <button onClick={() => setShowAddIp(false)} className="px-4 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm border border-white/10 transition">Cancel</button>
                </div>
              </div>
            )}

            {ipRules.length === 0 ? (
              <p className="text-white/30 text-sm py-4">No IP rules configured.</p>
            ) : (
              <div className="space-y-2">
                {ipRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${rule.type === "blacklist" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {rule.type}
                      </span>
                      <code className="text-white text-sm">{rule.ipAddress}</code>
                      {rule.reason && <span className="text-white/30 text-xs">— {rule.reason}</span>}
                    </div>
                    <button onClick={() => deleteIpRule(rule.id)} className="text-white/20 hover:text-red-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <History size={18} className="text-gold" /> Audit Trail
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-white/30 text-sm py-4">No audit logs recorded.</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2 text-white/40 text-xs font-medium uppercase sticky top-0 bg-black">Action</th>
                      <th className="text-left p-2 text-white/40 text-xs font-medium uppercase sticky top-0 bg-black">Admin</th>
                      <th className="text-left p-2 text-white/40 text-xs font-medium uppercase sticky top-0 bg-black">Target</th>
                      <th className="text-right p-2 text-white/40 text-xs font-medium uppercase sticky top-0 bg-black">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5">
                        <td className="p-2">
                          <span className="text-white/70 text-xs">{log.action}</span>
                        </td>
                        <td className="p-2 text-white/30 text-xs">{log.adminId?.slice(0, 8)}</td>
                        <td className="p-2 text-white/30 text-xs">{log.targetType}:{log.targetId?.slice(0, 8)}</td>
                        <td className="p-2 text-right text-white/20 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SecurityPage;