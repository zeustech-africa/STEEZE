"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Crown, CheckCircle } from "lucide-react";

const CONTRACT_TEXT = `
ZEUSLIVESTUDIO ARTIST MANAGEMENT AGREEMENT

This agreement is between ZeusLiveStudio (the "Management Company") and the Artist (the "Creator").

1. NATURE OF AGREEMENT
   - This is a non-exclusive, non-binding management agreement
   - Artist can terminate anytime without penalty
   - No time commitment or exclusivity required

2. WHAT WE DO
   - We promote content you provide to us
   - We distribute your music to streaming platforms
   - We monetize your content on STEEZE platform
   - We do NOT control your creative process
   - We do NOT pay for your content creation

3. REVENUE SHARING
   - Platform Revenue (STEEZE): 50% Artist / 50% ZeusLiveStudio
   - Distribution Revenue (Streaming): 50% Artist / 50% ZeusLiveStudio
   - All other revenue (gigs, endorsements, album sales, merchandise):
     * 100% Artist if we were not involved
     * 50% Artist / 50% ZeusLiveStudio if we facilitated the deal

4. YOUR BENEFITS
   - Free access to STEEZE platform (no subscription fees)
   - "ZeusLiveStudio Artist" badge on all content
   - Special profile branding and verification
   - Priority distribution to all channels
   - Dedicated admin support

5. TERMINATION
   - You can switch to Independent Creator anytime
   - No penalties, no fees, no questions asked
   - After switching: 70/30 revenue split applies
   - You keep all your content and followers

6. AGREEMENT
   By typing "I AGREE" and providing your e-signature below,
   you acknowledge that you have read and understood this agreement.

   Artist E-Signature: ______________
   Date: ______________
`;

interface ContractProps {
  onAgree: (agreedText: string, signature: string) => void;
  onBack: () => void;
  artistName: string;
}

export default function ZeusLiveStudioContract({ onAgree, onBack, artistName }: ContractProps) {
  const [agreedText, setAgreedText] = useState("");
  const [signature, setSignature] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!isChecked) {
      setError("You must check the box to agree to the terms");
      return;
    }
    if (agreedText !== "I AGREE") {
      setError('You must type "I AGREE" exactly');
      return;
    }
    if (!signature.trim()) {
      setError("You must provide your e-signature");
      return;
    }
    onAgree(agreedText, signature);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-gold/20">
          <FileText className="text-gold" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gold">ZeusLiveStudio Artist Agreement</h2>
          <p className="text-white/50 text-sm">Please read and accept the terms below</p>
        </div>
      </div>

      <div className="bg-black/50 border border-white/10 rounded-lg p-6 h-96 overflow-y-auto font-mono text-white/70 text-sm whitespace-pre-line">
        {CONTRACT_TEXT}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="agree"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="w-5 h-5 accent-gold"
          />
          <label htmlFor="agree" className="text-white/80">
            I have read and agree to the <span className="text-gold">ZeusLiveStudio Artist Agreement</span>
          </label>
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-1">
            Type <span className="text-gold font-bold">"I AGREE"</span> to confirm
          </label>
          <input
            type="text"
            value={agreedText}
            onChange={(e) => setAgreedText(e.target.value.toUpperCase())}
            placeholder='Type "I AGREE"'
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-1">E-Signature (Type your full name)</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={artistName}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={onBack} className="px-8 py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all">
          <ChevronLeft size={18} className="inline mr-2" /> Back
        </button>
        <button onClick={handleSubmit} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2">
          Sign & Continue <Crown size={18} />
        </button>
      </div>
    </div>
  );
}