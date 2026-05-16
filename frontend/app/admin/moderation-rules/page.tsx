"use client";

import { useEffect, useState } from "react";
import { Activity, Plus, ToggleLeft, ToggleRight, Shield, Clock } from "lucide-react";

interface ModerationRule {
  id: string;
  name: string;
  description?: string;
  condition: any;
  action: string;
  duration?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

const ModerationRulesPage = () => {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    field: "flags",
    operator: ">",
    value: "5",
    timeWindow: "24",
    action: "flag_for_review",
    duration: "24",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/moderation-rules", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRules(data.rules || []);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/moderation-rules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newRule.name,
          description: newRule.description,
          condition: {
            field: newRule.field,
            operator: newRule.operator,
            value: parseInt(newRule.value),
            timeWindow: parseInt(newRule.timeWindow),
          },
          action: newRule.action,
          duration: newRule.action === "temp_mute" ? parseInt(newRule.duration) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setNewRule({
          name: "",
          description: "",
          field: "flags",
          operator: ">",
          value: "5",
          timeWindow: "24",
          action: "flag_for_review",
          duration: "24",
        });
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to add rule:", err);
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/moderation-rules/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      temp_mute: "Temporary Mute",
      shadow_ban: "Shadow Ban",
      flag_for_review: "Flag for Review",
      block: "Block",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      temp_mute: "bg-yellow-500/20 text-yellow-400",
      shadow_ban: "bg-orange-500/20 text-orange-400",
      flag_for_review: "bg-blue-500/20 text-blue-400",
      block: "bg-red-500/20 text-red-400",
    };
    return colors[action] || "bg-white/10 text-white/50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="text-gold" size={28} /> Auto-Moderation Rules
        </h1>
        <p className="text-white/50 mt-1">Configure automated content moderation and flagging rules</p>
      </div>

      {/* Add Rule Button */}
      <button
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-sm border border-gold/30 transition"
      >
        <Plus size={16} /> New Rule
      </button>

      {/* Add Rule Form */}
      {showAdd && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Create Auto-Moderation Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-xs block mb-1">Rule Name</label>
              <input
                type="text"
                placeholder="e.g., Mass Flagging Detector"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50 transition"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Description</label>
              <input
                type="text"
                placeholder="What this rule does..."
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50 transition"
              />
            </div>

            <div>
              <label className="text-white/50 text-xs block mb-1">Condition Field</label>
              <select
                value={newRule.field}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="flags" className="bg-black">Number of Flags</option>
                <option value="spamScore" className="bg-black">Spam Score</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Operator</label>
              <select
                value={newRule.operator}
                onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
              >
<option value=">" className="bg-black">Greater than ({'>'})</option>
<option value=">=" className="bg-black">Greater than or equal ({'>'}=)</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Threshold Value</label>
              <input
                type="number"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Time Window (hours)</label>
              <input
                type="number"
                value={newRule.timeWindow}
                onChange={(e) => setNewRule({ ...newRule, timeWindow: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Action</label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="flag_for_review" className="bg-black">Flag for Review</option>
                <option value="temp_mute" className="bg-black">Temporary Mute</option>
                <option value="shadow_ban" className="bg-black">Shadow Ban</option>
                <option value="block" className="bg-black">Block</option>
              </select>
            </div>
            {newRule.action === "temp_mute" && (
              <div>
                <label className="text-white/50 text-xs block mb-1">Mute Duration (hours)</label>
                <input
                  type="number"
                  value={newRule.duration}
                  onChange={(e) => setNewRule({ ...newRule, duration: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addRule}
              className="px-4 py-2 rounded-lg bg-gold/20 text-gold text-sm border border-gold/30 hover:bg-gold/30 transition"
            >
              Create Rule
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-sm border border-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Activity className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/60 text-lg">No auto-moderation rules configured.</p>
          <p className="text-white/30 text-sm mt-1">Create a rule to automate content moderation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const condition = typeof rule.condition === "string" ? JSON.parse(rule.condition) : rule.condition;
            return (
              <div key={rule.id} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{rule.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${getActionColor(rule.action)}`}>
                        {getActionLabel(rule.action)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          rule.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/5 text-white/30"
                        }`}
                      >
                        {rule.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-white/50 text-sm mb-2">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span>
                        Condition: {condition?.field} {condition?.operator} {condition?.value} in{" "}
                        {condition?.timeWindow}h
                      </span>
                      {rule.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Duration: {rule.duration}h
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`p-1 rounded-lg transition ${
                      rule.isActive
                        ? "text-green-400 hover:bg-green-500/10"
                        : "text-white/20 hover:bg-white/10"
                    }`}
                    title={rule.isActive ? "Disable rule" : "Enable rule"}
                  >
                    {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModerationRulesPage;