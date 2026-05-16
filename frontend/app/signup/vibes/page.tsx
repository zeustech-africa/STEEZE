"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, User, CreditCard, FileText, Camera } from "lucide-react";
import ParentalConsentModal from "@/components/ParentalConsentModal";

const STORAGE_KEY = "steeze_vibes_signup";

const steps = [
  { number: 1, name: "Profile", icon: User },
  { number: 2, name: "Subscription", icon: CreditCard },
  { number: 3, name: "Documents", icon: FileText },
  { number: 4, name: "Verification", icon: Camera },
];

import Step1Profile from "@/components/signup/vibes/Step1Profile";
import Step2Subscription from "@/components/signup/vibes/Step2Subscription";
import Step3Documents from "@/components/signup/vibes/Step3Documents";
import Step4Selfie from "@/components/signup/vibes/Step4Selfie";

export default function VibesSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(parsed.formData || {});
      setCurrentStep(parsed.currentStep || 1);
      setCompletedSteps(parsed.completedSteps || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep, completedSteps }));
  }, [formData, currentStep, completedSteps]);

  const updateFormData = (newData: Record<string, unknown>) => setFormData((prev) => ({ ...prev, ...newData }));
  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) setCompletedSteps([...completedSteps, step]);
  };

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
      const response = await fetch("/api/vibes/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, consents }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.removeItem(STORAGE_KEY);
        router.push("/signup/vibes/pending");
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
      case 4: return (
        <>
          <Step4Selfie data={formData} updateData={updateFormData} onSubmit={handleSubmit} onBack={handleBack} loading={loading} markComplete={() => markStepComplete(4)} />
          {/* EXPLICIT CONSENT CHECKBOXES - POPIA/GDPR compliant, UNCHECKED by default */}
          <div className="space-y-4 mt-6 pt-4 border-t border-white/10">
            <h3 className="text-white font-semibold">Marketing Communications</h3>
            <p className="text-white/50 text-sm">We'd love to keep you updated about new features, content, and offers. You can unsubscribe at any time.</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consents.email_marketing} onChange={(e) => setConsents({ ...consents, email_marketing: e.target.checked })} className="mt-1 w-4 h-4 accent-gold" />
              <div><p className="text-white">Email Marketing</p><p className="text-white/40 text-sm">Receive updates, newsletters, and special offers via email</p></div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consents.sms_marketing} onChange={(e) => setConsents({ ...consents, sms_marketing: e.target.checked })} className="mt-1 w-4 h-4 accent-gold" />
              <div><p className="text-white">SMS Marketing</p><p className="text-white/40 text-sm">Receive SMS updates about your account and promotions</p></div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consents.push_notifications} onChange={(e) => setConsents({ ...consents, push_notifications: e.target.checked })} className="mt-1 w-4 h-4 accent-gold" />
              <div><p className="text-white">Push Notifications</p><p className="text-white/40 text-sm">Receive real-time alerts about engagement and new content</p></div>
            </label>
            <p className="text-white/40 text-xs mt-2">You can change these preferences at any time in Settings. Essential communications (account verification, security alerts) will still be sent.</p>
          </div>
        </>
      );
      default: return null;
    }
  };

  const StepIcon = steps[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background Video */}
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-30">
        <source src="/videos/fans-bg.mp4" type="video/mp4" />
      </video>

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* AGE GATE - Step before anything else */}
        {showAgeGate && !showParentalConsent && (
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
                aria-describedby={ageError ? "vibes-age-error" : undefined}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
                max={new Date().toISOString().split('T')[0]}
              />
              {ageError && <p id="vibes-age-error" role="alert" className="text-red-500 text-sm mb-4">{ageError}</p>}
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
          childName={(formData.artistName as string) || (formData.displayName as string) || ""}
        />

        {/* Progress Bar - only shown after age gate */}
        {!showAgeGate && (
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
        )}

        {/* Step Content - only shown after age gate */}
        {!showAgeGate && (
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-gold/20">
                  <StepIcon className="text-gold" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gold">Step {currentStep}: {steps[currentStep - 1].name}</h2>
                  <p className="text-white/50 text-sm">Join the STEEZE community as a VIBE</p>
                </div>
              </div>
              {renderStep()}
            </div>
          </motion.div>
        </AnimatePresence>
        )}

        {/* Mind-blowing Info Banner */}
        <div className="mt-8 p-4 bg-gold/5 border border-gold/20 rounded-lg">
          <p className="text-white/60 text-sm text-center italic">
            "STEEZE is not Facebook. No politics. No news. No violence. Just pure entertainment.
            Every account is verified. Every creator is real. Every VIBE is authentic.
            When you subscribe to a creator, you get exclusive content, downloads, and even direct video calls.
            This is the future of entertainment."
          </p>
        </div>
      </div>
    </div>
  );
}