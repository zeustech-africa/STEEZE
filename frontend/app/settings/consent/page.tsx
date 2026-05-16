"use client";

import { useState, useEffect } from "react";
import { Mail, Smartphone, Bell, BarChart3, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function ConsentSettingsPage() {
  const [consents, setConsents] = useState({
    email_marketing: false,
    sms_marketing: false,
    push_notifications: false,
    analytics: true,
  });
  const [optOutStatus, setOptOutStatus] = useState({
    email_marketing: false,
    sms_marketing: false,
    push_notifications: false,
    all: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConsents();
    fetchOptOutStatus();
  }, []);

  const fetchConsents = async () => {
    try {
      const res = await fetch("/api/consent");
      const data = await res.json();
      if (data.success) {
        setConsents(data.consents);
      }
    } catch (error) {
      console.error("Failed to fetch consents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptOutStatus = async () => {
    try {
      const res = await fetch("/api/optout/status");
      const data = await res.json();
      if (data.success) {
        setOptOutStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch opt-out status:", error);
    }
  };

  const saveConsents = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consents),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save consents:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUnsubscribe = async () => {
    if (!confirm("Unsubscribe from ALL marketing communications? You will no longer receive any emails or notifications from STEEZE.")) {
      return;
    }
    try {
      const res = await fetch("/api/optout/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentType: "all" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOptOutStatus();
        fetchConsents();
      }
    } catch (error) {
      console.error("Bulk unsubscribe failed:", error);
    }
  };

  const consentOptions = [
    { id: "email_marketing", label: "Email Marketing", icon: Mail, description: "Receive updates, newsletters, and special offers via email" },
    { id: "sms_marketing", label: "SMS Marketing", icon: Smartphone, description: "Receive SMS updates about your account and promotions" },
    { id: "push_notifications", label: "Push Notifications", icon: Bell, description: "Receive real-time alerts about engagement and new content" },
    { id: "analytics", label: "Analytics Cookies", icon: BarChart3, description: "Help us understand how you use STEEZE to improve the platform" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading...</div>
      </div>
    );
  }

  const isFullyOptedOut = optOutStatus.all;
  const hasAnyOptOut = optOutStatus.email_marketing || optOutStatus.sms_marketing || optOutStatus.push_notifications || optOutStatus.all;

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gold mb-2">Communication Preferences</h1>
        <p className="text-white/50 mb-8">Manage how we communicate with you. You can change these preferences at any time.</p>

        {/* Opt-Out Status Banner */}
        {hasAnyOptOut && (
          <div className="glass-card p-4 mb-6 bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-400 font-semibold mb-1">
                  {isFullyOptedOut ? "You have opted out of all marketing communications" : "Some communications are paused"}
                </p>
                <div className="space-y-1 text-yellow-400/80 text-sm">
                  {optOutStatus.email_marketing && <p>• You are currently unsubscribed from marketing emails.</p>}
                  {optOutStatus.sms_marketing && <p>• You are currently unsubscribed from SMS marketing.</p>}
                  {optOutStatus.push_notifications && <p>• You are currently unsubscribed from push notifications.</p>}
                  {optOutStatus.all && <p>• You have opted out of all marketing communications.</p>}
                </div>
                {isFullyOptedOut && (
                  <p className="text-yellow-400/60 text-xs mt-2">To resume receiving communications, toggle the preferences below and save.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-gold" size={20} />
            <h2 className="text-white font-semibold text-lg">Your Privacy Choices</h2>
          </div>
          <p className="text-white/60 text-sm mb-6">
            Under POPIA, we require your explicit consent for marketing communications. Essential communications (account verification, security alerts, transaction confirmations) will still be sent regardless of your preferences.
          </p>

          <div className="space-y-4">
            {consentOptions.map((option) => {
              const Icon = option.icon;
              const isOptedOut = option.id === "email_marketing" && (optOutStatus.email_marketing || optOutStatus.all) ||
                option.id === "sms_marketing" && (optOutStatus.sms_marketing || optOutStatus.all) ||
                option.id === "push_notifications" && (optOutStatus.push_notifications || optOutStatus.all);

              return (
                <div key={option.id}>
                  <label className="flex items-start gap-4 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-all">
                    <div className="p-2 rounded-full bg-gold/20">
                      <Icon className="text-gold" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-white/40 text-sm">{option.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={consents[option.id as keyof typeof consents]}
                      onChange={(e) => setConsents({ ...consents, [option.id]: e.target.checked })}
                      className="w-5 h-5 accent-gold"
                    />
                  </label>
                  {isOptedOut && option.id !== "analytics" && (
                    <div className="ml-14 mt-1 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-xs">You are currently opted out of {option.label.toLowerCase()}. Toggle above and save to resubscribe.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
            <button
              onClick={handleBulkUnsubscribe}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-sm hover:bg-red-500 hover:text-black transition-all"
            >
              Unsubscribe from All Marketing
            </button>
            <button
              onClick={saveConsents}
              disabled={saving}
              className="px-6 py-2 bg-gold text-black rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? "Saving..." : "Save Preferences"}
              {saved && <CheckCircle size={16} className="text-green-600" />}
            </button>
          </div>
        </div>

        <div className="glass-card p-6 bg-gold/5 border border-gold/30">
          <h3 className="text-white font-semibold mb-2">Your Rights Under POPIA</h3>
          <p className="text-white/60 text-sm">
            You have the right to withdraw your consent at any time. We keep a record of your consent choices for compliance purposes. Opt-out requests are honored within 10 days as required by POPIA. For questions about your data, contact our{" "}
            <a href="/privacy" className="text-gold hover:underline">Data Protection Officer</a>.
          </p>
        </div>
      </div>
    </div>
  );
}