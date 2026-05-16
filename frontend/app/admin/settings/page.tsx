"use client";

import { useEffect, useState } from "react";
import { Settings, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

const SettingsPage = () => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch("/api/admin/maintenance", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceEnabled(data.maintenanceMode);
      }
    } catch (error) {
      console.error("Failed to fetch maintenance status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const newState = !maintenanceEnabled;
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          isEnabled: newState,
          message: maintenanceMessage || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceEnabled(newState);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to toggle maintenance:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          <p className="text-white/50 mt-1">Platform configuration</p>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-yellow-400" size={20} />
          <h3 className="text-white font-semibold text-lg">Maintenance Mode</h3>
        </div>

        <p className="text-white/50 text-sm mb-4">
          When enabled, all non-admin users will see a maintenance page and won't be able to access the platform. Use this during updates or downtime.
        </p>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-white/10 rounded w-40" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMaintenance}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                  maintenanceEnabled
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                }`}
              >
                {maintenanceEnabled ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
                {saving ? "Saving..." : maintenanceEnabled ? "Disable Maintenance" : "Enable Maintenance"}
              </button>
              {saved && (
                <span className="text-green-400 text-sm">Settings saved!</span>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${
              maintenanceEnabled
                ? "bg-red-500/5 border-red-500/30"
                : "bg-white/5 border-white/10"
            }`}>
              <p className={`text-sm ${maintenanceEnabled ? "text-red-400" : "text-white/40"}`}>
                Maintenance Mode: <strong>{maintenanceEnabled ? "ON" : "OFF"}</strong>
              </p>
              {maintenanceEnabled && (
                <p className="text-red-400/60 text-xs mt-1">
                  All non-admin users are currently blocked from accessing the platform.
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-2">
                Maintenance Message (shown to users)
              </label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="We're currently performing scheduled maintenance. We'll be back shortly!"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 min-h-[80px] resize-y text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Scan Rules Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="text-white/40" size={20} />
          <h3 className="text-white font-semibold text-lg">Content Scan Rules</h3>
        </div>
        <p className="text-white/50 text-sm mb-2">
          Auto-scan checks all posts before they reach the admin queue. Prohibited words and patterns are blocked automatically.
        </p>
        <p className="text-white/30 text-xs">
          Rules include: politics, violence/gore, hate speech, news/sad stories, religion, and scams/spam. Managed via the content_scan_rules database table.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
          onClick={() => alert("Content scan rules are managed via database. Use prisma studio or direct SQL to modify.")}
        >
          View All Rules
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;