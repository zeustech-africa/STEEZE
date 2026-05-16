"use client";

import { useState } from "react";
import { Mail, Shield, CreditCard, X } from "lucide-react";

interface ParentalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: string, email: string) => void;
  childName: string;
}

export default function ParentalConsentModal({ isOpen, onClose, onConfirm, childName }: ParentalConsentModalProps) {
  const [method, setMethod] = useState<"email" | "id_scan" | "credit_card">("email");
  const [parentEmail, setParentEmail] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gold">Parental Consent Required</h2>
          <button onClick={onClose}><X className="text-white/50" /></button>
        </div>
        <p className="text-white/60 mb-4">
          Since you are under 18, we need parental consent to create your STEEZE account for <strong className="text-gold">{childName || "you"}</strong>.
        </p>
        
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setMethod("email")}
            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${method === "email" ? "border-gold bg-gold/10" : "border-white/20"}`}
          >
            <Mail className="text-gold" size={20} />
            <div className="text-left"><p className="text-white font-semibold">Email Consent</p><p className="text-white/40 text-xs">Parent receives verification email</p></div>
          </button>
          <button
            onClick={() => setMethod("id_scan")}
            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${method === "id_scan" ? "border-gold bg-gold/10" : "border-white/20"}`}
          >
            <Shield className="text-gold" size={20} />
            <div className="text-left"><p className="text-white font-semibold">ID Verification</p><p className="text-white/40 text-xs">Parent scans ID document</p></div>
          </button>
          <button
            onClick={() => setMethod("credit_card")}
            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${method === "credit_card" ? "border-gold bg-gold/10" : "border-white/20"}`}
          >
            <CreditCard className="text-gold" size={20} />
            <div className="text-left"><p className="text-white font-semibold">Credit Card Verification</p><p className="text-white/40 text-xs">Parent enters credit card details</p></div>
          </button>
        </div>
        
        <input
          type="email"
          placeholder="Parent Email Address"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
        />
        
        <button
          onClick={() => onConfirm(method, parentEmail)}
          className="w-full py-3 bg-gold text-black rounded-full font-bold"
        >
          Send Consent Request
        </button>
      </div>
    </div>
  );
}