"use client";

import { useState, useEffect } from "react";
import { Shield, Users, Eye, Lock, CheckCircle, Crown } from "lucide-react";

export default function ParentalControlsPage() {
  const [user, setUser] = useState<any>(null);
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [contentFilter, setContentFilter] = useState("none");
  const [childCode, setChildCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchLinkedChildren();
    fetchContentFilter();
  }, []);

  const fetchLinkedChildren = async () => {
    try {
      const res = await fetch("/api/age-verification/parent/children", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setLinkedChildren(data.children);
    } catch (error) {
      console.error("Failed to fetch linked children:", error);
    }
  };

  const fetchContentFilter = async () => {
    try {
      const res = await fetch("/api/age-verification/content-filter", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setContentFilter(data.filterLevel);
    } catch (error) {
      console.error("Failed to fetch content filter:", error);
    }
  };

  const updateContentFilter = async (level: string) => {
    setLoading(true);
    try {
      await fetch("/api/age-verification/content-filter", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ filterLevel: level }),
      });
      setContentFilter(level);
    } catch (error) {
      console.error("Failed to update content filter:", error);
    } finally {
      setLoading(false);
    }
  };

  const linkChild = async () => {
    if (!childCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/age-verification/parent/link-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ childCode }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLinkedChildren();
        setChildCode("");
      } else {
        alert(data.message || "Failed to link child");
      }
    } catch (error) {
      console.error("Failed to link child:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeChild = async (childId: string) => {
    try {
      await fetch(`/api/age-verification/parent/children/${childId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      fetchLinkedChildren();
    } catch (error) {
      console.error("Failed to remove child:", error);
    }
  };

  const filterLevels = [
    { value: "none", label: "None", description: "All content visible", icon: Eye },
    { value: "moderate", label: "Moderate", description: "Blocks age-restricted content", icon: Shield },
    { value: "strict", label: "Strict", description: "Blocks all mature content + age-restricted", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gold mb-6 flex items-center gap-3">
          <Shield size={28} /> Parental Controls
        </h1>

        {/* Content Filter */}
        <div className="glass-card p-6 mb-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Crown size={18} className="text-gold" /> Content Filter
          </h2>
          <div className="space-y-3">
            {filterLevels.map((level) => {
              const Icon = level.icon;
              return (
                <button
                  key={level.value}
                  onClick={() => updateContentFilter(level.value)}
                  disabled={loading}
                  className={`w-full p-4 rounded-lg border transition-all text-left flex items-center justify-between ${
                    contentFilter === level.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-gold/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={contentFilter === level.value ? "text-gold" : "text-white/50"} size={20} />
                    <div>
                      <p className="text-white font-semibold">{level.label}</p>
                      <p className="text-white/40 text-sm">{level.description}</p>
                    </div>
                  </div>
                  {contentFilter === level.value && <CheckCircle className="text-gold" size={20} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Link Children */}
        <div className="glass-card p-6 mb-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Users size={18} className="text-gold" /> Linked Children
          </h2>
          <p className="text-white/40 text-sm mb-4">
            Link your child's account to manage their content access and safety settings.
          </p>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Enter child's linking code"
              value={childCode}
              onChange={(e) => setChildCode(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              onClick={linkChild}
              disabled={loading}
              className="px-4 py-2 bg-gold text-black rounded-lg font-semibold disabled:opacity-50 transition-opacity"
            >
              Link
            </button>
          </div>
          {linkedChildren.length > 0 ? (
            <div className="space-y-2">
              {linkedChildren.map((child) => (
                <div key={child.id} className="flex justify-between items-center py-3 px-3 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-white">{child.name}</p>
                    <p className="text-white/40 text-xs">Age: {child.age}</p>
                  </div>
                  <button
                    onClick={() => removeChild(child.id)}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">No children linked yet.</p>
          )}
        </div>

        {/* Safety Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Eye size={18} className="text-gold" /> Safety Information
          </h2>
          <ul className="space-y-3 text-white/50 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
              Age-restricted content (18+) is automatically hidden from users under 18.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
              Content filter settings apply to all devices where your child is signed in.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
              You can unlink a child's account at any time from this page.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
              STEEZE does not allow users under 13 to create accounts.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}