"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, CreditCard, FileText, Heart, Shield, CheckCircle, Users, Sparkles } from "lucide-react";
import ParentalConsentModal from "@/components/ParentalConsentModal";
import Captcha from "@/components/Captcha";

const STORAGE_KEY = "steeze_vibes_signup";

const steps = [
  { number: 1, name: "Profile & Bio", icon: User },
  { number: 2, name: "Subscription", icon: CreditCard },
  { number: 3, name: "Documents", icon: FileText },
];

import Step1Profile from "@/components/signup/vibes/Step1Profile";
import Step2Subscription from "@/components/signup/vibes/Step2Subscription";
import Step3Documents from "@/components/signup/vibes/Step3Documents";

export default function VibesSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);

  // AGE GATE state
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [ageError, setAgeError] = useState("");
  const [showParentalConsent, setShowParentalConsent] = useState(false);

  // EXPLICIT CONSENT - UNCHECKED by default (GDPR/POPIA opt-in)
  const [consents, setConsents] = useState({
    email_marketing: false,
    sms_marketing: false,
    push_notifications: false,
    analytics: true,
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birth = new Date(birthDateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAgeSubmit = () => {
    if (!birthDate) {
      setAgeError("Please enter your date of birth.");
      return;
    }
    const age = calculateAge(birthDate);
    if (age < 13) {
      setAgeError("You must be at least 13 years old to join STEEZE.");
      return;
    }
    if (age < 18) {
      setShowParentalConsent(true);
      return;
    }
    updateFormData({ birthDate, age });
    setShowAgeGate(false);
  };

  const handleParentalConsentConfirm = (method: string, parentEmail: string) => {
    updateFormData({ birthDate, age: calculateAge(birthDate), parentalConsentMethod: method, parentalConsentEmail: parentEmail });
    setShowParentalConsent(false);
    setShowAgeGate(false);
  };

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(parsed.formData || {});
      setCurrentStep(parsed.currentStep || 1);
      setCompletedSteps(parsed.completedSteps || []);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep, completedSteps }));
  }, [formData, currentStep, completedSteps]);

  const updateFormData = useCallback((newData: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) return [...prev, step];
      return prev;
    });
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Require CAPTCHA for public signup
      if (!captchaToken) {
        setCaptchaError(true);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/vibes/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, consents, cfTurnstileResponse: captchaToken }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.removeItem(STORAGE_KEY);
        router.push(`/verification/selfie?userId=${data.userId}`);
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      alert("Network error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Profile data={formData} updateData={updateFormData} onNext={handleNext} markComplete={() => markStepComplete(1)} />;
      case 2: return <Step2Subscription data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} markComplete={() => markStepComplete(2)} />;
      case 3: return <Step3Documents data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} markComplete={() => markStepComplete(3)} />;
      default: return null;
    }
  };

  const StepIcon = steps[currentStep - 1].icon;

  // ============================================================
  // MOBILE RENDER: Simple centered form
  // ============================================================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* AGE GATE */}
          {showAgeGate && !showParentalConsent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="glass-card p-8 text-center max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gold mb-4">Verify Your Age</h2>
                <p className="text-white/70 mb-6">STEEZE requires all users to be at least 13 years old.</p>
                <label htmlFor="vibes-birthdate-m" className="block text-sm font-medium text-gray-300 mb-1 text-left">
                  Date of Birth
                </label>
                <input
                  id="vibes-birthdate-m"
                  type="date"
                  value={birthDate}
                  onChange={(e) => { setBirthDate(e.target.value); setAgeError(""); }}
                  aria-required="true"
                  aria-describedby={ageError ? "vibes-age-error-m" : undefined}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
                  max={new Date().toISOString().split('T')[0]}
                />
                {ageError && <p id="vibes-age-error-m" role="alert" className="text-red-500 text-sm mb-4">{ageError}</p>}
                <button onClick={handleAgeSubmit} className="w-full py-3 bg-gold text-black rounded-full font-bold">
                  Continue
                </button>
                <p className="text-white/40 text-xs mt-4">By continuing, you confirm your age is accurate.</p>
              </div>
            </motion.div>
          )}

          {/* Parental Consent Modal */}
          <ParentalConsentModal
            isOpen={showParentalConsent}
            onClose={() => setShowParentalConsent(false)}
            onConfirm={handleParentalConsentConfirm}
            childName={(formData.displayName as string) || ""}
          />

          {/* Steps 1-4 */}
          {!showAgeGate && (
            <>
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  {steps.map((step) => (
                    <div key={step.number} className={`flex flex-col items-center ${currentStep >= step.number ? "text-gold" : "text-white/40"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= step.number ? "border-gold bg-gold/20 text-gold" : "border-white/20 text-white/40"} ${completedSteps.includes(step.number) ? "bg-gold text-black border-gold" : ""}`}>
                        {completedSteps.includes(step.number) ? <Check size={18} /> : step.number}
                      </div>
                      <span className="text-xs mt-1 hidden md:block">{step.name}</span>
                    </div>
                  ))}
                </div>
                <div className="relative h-2 bg-white/10 rounded-full mt-4">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-300" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <div className="glass-card p-6 md:p-8">
                    {StepIcon && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-full bg-gold/20">
                          <StepIcon className="text-gold" size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gold">Step {currentStep}: {steps[currentStep - 1].name}</h2>
                          <p className="text-white/50 text-sm">Set up your VIBE fan account to enjoy pure entertainment</p>
                        </div>
                      </div>
                    )}
                    {renderStep()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}

          {/* Info Banner */}
          <div className="mt-8 p-4 bg-gold/5 border border-gold/20 rounded-lg">
            <p className="text-white/60 text-sm text-center italic">
              "STEEZE is not Facebook. No politics. No news. No violence. Just pure entertainment.
              Every fan is verified. Every interaction is real. Welcome to the VIBES."
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DESKTOP RENDER: Split layout with marketing content
  // ============================================================
  const renderDesktopContent = () => {
    if (showAgeGate && !showParentalConsent) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gold mb-4">Verify Your Age</h2>
            <p className="text-white/70 mb-6">STEEZE requires all users to be at least 13 years old.</p>
            <label htmlFor="vibes-birthdate" className="block text-sm font-medium text-gray-300 mb-1 text-left">
              Date of Birth
            </label>
            <input
              id="vibes-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => { setBirthDate(e.target.value); setAgeError(""); }}
              aria-required="true"
              aria-describedby={ageError ? "vibes-age-error-d" : undefined}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              max={new Date().toISOString().split('T')[0]}
            />
            {ageError && <p id="vibes-age-error-d" role="alert" className="text-red-500 text-sm mb-4">{ageError}</p>}
            <button onClick={handleAgeSubmit} className="w-full py-3 bg-gold text-black rounded-full font-bold">
              Continue
            </button>
            <p className="text-white/40 text-xs mt-4">By continuing, you confirm your age is accurate.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div key={step.number} className={`flex flex-col items-center ${currentStep >= step.number ? "text-gold" : "text-white/40"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= step.number ? "border-gold bg-gold/20 text-gold" : "border-white/20 text-white/40"} ${completedSteps.includes(step.number) ? "bg-gold text-black border-gold" : ""}`}>
                  {completedSteps.includes(step.number) ? <Check size={18} /> : step.number}
                </div>
                <span className="text-xs mt-1">{step.name}</span>
              </div>
            ))}
          </div>
          <div className="relative h-2 bg-white/10 rounded-full mt-4">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-300" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <div className="glass-card p-6 md:p-8">
              {StepIcon && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-gold/20">
                    <StepIcon className="text-gold" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gold">Step {currentStep}: {steps[currentStep - 1].name}</h2>
                    <p className="text-white/50 text-sm">Set up your VIBE fan account to enjoy pure entertainment</p>
                  </div>
                </div>
              )}
              {renderStep()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Parental Consent Modal */}
      <ParentalConsentModal
        isOpen={showParentalConsent}
        onClose={() => setShowParentalConsent(false)}
        onConfirm={handleParentalConsentConfirm}
        childName={(formData.displayName as string) || ""}
      />

      <div className="grid md:grid-cols-2 min-h-screen">
        {/* LEFT SIDE: Marketing Content */}
        <div className="relative bg-gradient-to-br from-black via-black/90 to-gold/10 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/fan-tier-free.jpg"
              alt="Join VIBES"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>
          <div className="relative z-10 px-12 py-16 max-w-lg mx-auto text-center">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 text-gold text-3xl font-bold tracking-wider">
                <Heart className="text-gold" size={32} /> STEEZE VIBES
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-gold">FEEL THE VIBES</span>
            </h1>
            <p className="text-white/60 text-lg mb-6">
              Discover pure, verified entertainment from real creators. No fake accounts. No noise.
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">1M+</div>
                <div className="text-white/50 text-sm">Hours of Content</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">50K+</div>
                <div className="text-white/50 text-sm">Verified Creators</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>No fake accounts — every profile is verified</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Pure entertainment — music, videos, live streams</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Subscribe to support your favorite creators</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Zero politics, zero news — just content you love</span>
              </p>
            </div>

            {/* Powered by */}
            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="text-white/30 text-xs uppercase tracking-widest">Powered by ZeusLiveStudio</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Signup Form */}
        <div className="flex items-center justify-center px-8 py-12 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl">
            {renderDesktopContent()}
            {/* Info Banner */}
            <div className="mt-6 p-4 bg-gold/5 border border-gold/20 rounded-lg">
              <p className="text-white/60 text-sm text-center italic">
                "STEEZE is not Facebook. No politics. No news. No violence. Just pure entertainment.
                Every fan is verified. Every interaction is real. Welcome to the VIBES."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}