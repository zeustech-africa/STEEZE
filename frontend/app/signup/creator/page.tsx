"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, User, Image, FileText, Crown, Shield, CheckCircle, Music, Globe, DollarSign } from "lucide-react";
import ZeusLiveStudioContract from "@/components/contract/ZeusLiveStudioContract";
import ParentalConsentModal from "@/components/ParentalConsentModal";
import Captcha from "@/components/Captcha";

const STORAGE_KEY = "steeze_creator_signup";

const steps = [
  { number: 1, name: "Profile & Bio", icon: User },
  { number: 2, name: "Photos & Media", icon: Image },
  { number: 3, name: "Documents", icon: FileText },
];

import Step1Profile from "@/components/signup/creator/Step1Profile";
import Step2Media from "@/components/signup/creator/Step2Media";
import Step3Documents from "@/components/signup/creator/Step3Documents";

export default function CreatorSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0 = type selection, 1-4 = steps
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [creatorType, setCreatorType] = useState<"zls" | "independent" | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      setCurrentStep(parsed.currentStep || 0);
      setCompletedSteps(parsed.completedSteps || []);
      setCreatorType(parsed.creatorType || null);
      setContractSigned(parsed.contractSigned || false);
      setShowContract(parsed.showContract || false);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep, completedSteps, creatorType, contractSigned, showContract }));
  }, [formData, currentStep, completedSteps, creatorType, contractSigned, showContract]);

  const updateFormData = useCallback((newData: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) return [...prev, step];
      return prev;
    });
  }, []);

  const handleTypeSelect = (type: "zls" | "independent") => {
    setCreatorType(type);
    updateFormData({ creatorType: type });
    if (type === "zls") {
      setShowContract(true);
    } else {
      // Independent creator - go straight to Step 1
      setCurrentStep(1);
    }
  };

  const handleContractAgree = async (agreedText: string, signature: string) => {
    updateFormData({ contractAgreedText: agreedText, contractSignature: signature });
    setContractSigned(true);
    setShowContract(false);
    setCurrentStep(1);
  };

  const handleContractBack = () => {
    setShowContract(false);
    setCreatorType(null);
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
    } else if (currentStep === 1) {
      // Go back to type selection
      setCurrentStep(0);
      setCreatorType(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'profilePic' && key !== 'profilePicPreview') {
          formDataToSend.append(key, value as string);
        }
      });
      // Append profile picture if present
      if (formData.profilePic instanceof File) {
        formDataToSend.append('profilePic', formData.profilePic);
      }
      // Append consents as JSON string
      formDataToSend.append('consents', JSON.stringify(consents));

      // Require CAPTCHA for public signup
      if (!captchaToken) {
        setCaptchaError(true);
        setLoading(false);
        return;
      }
      formDataToSend.append("cfTurnstileResponse", captchaToken);

      const response = await fetch("/api/creators/signup", {
        method: "POST",
        body: formDataToSend,
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
      case 2: return <Step2Media data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} markComplete={() => markStepComplete(2)} />;
      case 3: return <Step3Documents data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} markComplete={() => markStepComplete(3)} />;
      default: return null;
    }
  };

  const StepIcon = currentStep > 0 ? steps[currentStep - 1].icon : null;

  // ============================================================
  // MOBILE RENDER: Keep existing simple form design
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
                <label htmlFor="creator-birthdate-m" className="block text-sm font-medium text-gray-300 mb-1 text-left">
                  Date of Birth
                </label>
                <input
                  id="creator-birthdate-m"
                  type="date"
                  value={birthDate}
                  onChange={(e) => { setBirthDate(e.target.value); setAgeError(""); }}
                  aria-required="true"
                  aria-describedby={ageError ? "creator-age-error-m" : undefined}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
                  max={new Date().toISOString().split('T')[0]}
                />
                {ageError && <p id="creator-age-error-m" role="alert" className="text-red-500 text-sm mb-4">{ageError}</p>}
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
            childName={(formData.artistName as string) || ""}
          />

          {/* Type Selection (Step 0) */}
          {!showAgeGate && currentStep === 0 && !showContract && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="glass-card p-8 text-center">
                <h2 className="text-3xl font-bold text-gold mb-2">Choose Your Path</h2>
                <p className="text-white/50 mb-8">Select how you want to join STEEZE as a creator</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div onClick={() => handleTypeSelect("zls")} className="cursor-pointer glass-card p-6 hover:border-gold transition-all border border-white/10 rounded-xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                      <Crown className="text-gold" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ZeusLiveStudio Artist</h3>
                    <p className="text-gold text-sm mb-3">FREE Platform • 50/50 Split</p>
                    <ul className="text-white/60 text-sm space-y-1.5 text-left">
                      <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Free access to all platform features</li>
                      <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> 50% of all platform and distribution revenue</li>
                      <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> "ZeusLiveStudio Artist" badge on all content</li>
                      <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Priority distribution to all channels</li>
                      <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Legal contract with ZeusLiveStudio</li>
                    </ul>
                  </div>
                  <div onClick={() => handleTypeSelect("independent")} className="cursor-pointer glass-card p-6 hover:border-gold transition-all border border-white/10 rounded-xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                      <Shield className="text-white/60" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Independent Creator</h3>
                    <p className="text-white/50 text-sm mb-3">Subscription • 70/30 Split</p>
                    <ul className="text-white/60 text-sm space-y-1.5 text-left">
                      <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> Monthly subscription to use platform</li>
                      <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> 70% of all platform and distribution revenue</li>
                      <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> No long-term commitment</li>
                      <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> Standard distribution to channels</li>
                      <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> No legal contract required</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contract Step (ZLS only) */}
          {showContract && creatorType === "zls" && (
            <div className="glass-card p-6 md:p-8">
              <ZeusLiveStudioContract
                onAgree={handleContractAgree}
                onBack={handleContractBack}
                artistName={(formData.artistName as string) || "Artist Name"}
              />
            </div>
          )}

          {/* Regular Steps (1-4) */}
          {currentStep > 0 && (
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
                <div className="flex justify-center mt-4">
                  {creatorType === "zls" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs border border-gold/30">
                      <Crown size={12} /> ZeusLiveStudio Artist {contractSigned && "✓ Contract Signed"}
                    </span>
                  )}
                  {creatorType === "independent" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs border border-white/10">
                      <Shield size={12} /> Independent Creator
                    </span>
                  )}
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
                          <p className="text-white/50 text-sm">Tell us about yourself to build your premium artist profile</p>
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
              Every account is verified. Every creator is real. Every VIBE is authentic. This is your stage."
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
    // Age gate
    if (showAgeGate && !showParentalConsent) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gold mb-4">Verify Your Age</h2>
            <p className="text-white/70 mb-6">STEEZE requires all users to be at least 13 years old.</p>
            <label htmlFor="creator-birthdate" className="block text-sm font-medium text-gray-300 mb-1 text-left">
              Date of Birth
            </label>
            <input
              id="creator-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => { setBirthDate(e.target.value); setAgeError(""); }}
              aria-required="true"
              aria-describedby={ageError ? "creator-age-error-d" : undefined}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              max={new Date().toISOString().split('T')[0]}
            />
            {ageError && <p id="creator-age-error-d" role="alert" className="text-red-500 text-sm mb-4">{ageError}</p>}
            <button onClick={handleAgeSubmit} className="w-full py-3 bg-gold text-black rounded-full font-bold">
              Continue
            </button>
            <p className="text-white/40 text-xs mt-4">By continuing, you confirm your age is accurate.</p>
          </div>
        </motion.div>
      );
    }

    // Contract step (ZLS only)
    if (showContract && creatorType === "zls") {
      return (
        <div className="glass-card p-6 md:p-8 w-full">
          <ZeusLiveStudioContract
            onAgree={handleContractAgree}
            onBack={handleContractBack}
            artistName={(formData.artistName as string) || "Artist Name"}
          />
        </div>
      );
    }

    // Step 0: Type selection
    if (currentStep === 0) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="glass-card p-8 text-center w-full">
            <h2 className="text-3xl font-bold text-gold mb-2">Choose Your Path</h2>
            <p className="text-white/50 mb-8">Select how you want to join STEEZE as a creator</p>
            <div className="grid grid-cols-2 gap-6">
              <div onClick={() => handleTypeSelect("zls")} className="cursor-pointer glass-card p-6 hover:border-gold transition-all border border-white/10 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                  <Crown className="text-gold" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">ZeusLiveStudio Artist</h3>
                <p className="text-gold text-sm mb-3">FREE Platform • 50/50 Split</p>
                <ul className="text-white/60 text-sm space-y-1.5 text-left">
                  <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Free access to all platform features</li>
                  <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> 50% of all platform and distribution revenue</li>
                  <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> "ZeusLiveStudio Artist" badge on all content</li>
                  <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Priority distribution to all channels</li>
                  <li className="flex items-start gap-2"><Crown size={14} className="text-gold mt-0.5 shrink-0" /> Legal contract with ZeusLiveStudio</li>
                </ul>
              </div>
              <div onClick={() => handleTypeSelect("independent")} className="cursor-pointer glass-card p-6 hover:border-gold transition-all border border-white/10 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="text-white/60" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Independent Creator</h3>
                <p className="text-white/50 text-sm mb-3">Subscription • 70/30 Split</p>
                <ul className="text-white/60 text-sm space-y-1.5 text-left">
                  <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> Monthly subscription to use platform</li>
                  <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> 70% of all platform and distribution revenue</li>
                  <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> No long-term commitment</li>
                  <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> Standard distribution to channels</li>
                  <li className="flex items-start gap-2"><Shield size={14} className="text-white/40 mt-0.5 shrink-0" /> No legal contract required</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Steps 1-4
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
          <div className="flex justify-center mt-4">
            {creatorType === "zls" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs border border-gold/30">
                <Crown size={12} /> ZeusLiveStudio Artist {contractSigned && "✓ Contract Signed"}
              </span>
            )}
            {creatorType === "independent" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs border border-white/10">
                <Shield size={12} /> Independent Creator
              </span>
            )}
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
                    <p className="text-white/50 text-sm">Tell us about yourself to build your premium artist profile</p>
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
        childName={(formData.artistName as string) || ""}
      />

      <div className="grid md:grid-cols-2 min-h-screen">
        {/* LEFT SIDE: Marketing Content */}
        <div className="relative bg-gradient-to-br from-black via-black to-gold/10 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/creator-card-1.jpg"
              alt="Become a Creator"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>
          <div className="relative z-10 px-12 py-16 max-w-lg mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-gold">START YOUR STEEZE</span>
            </h1>
            <p className="text-white/60 text-lg mb-6">
              Join thousands of creators already earning on STEEZE
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">70%</div>
                <div className="text-white/50 text-sm">Revenue Share</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">50K+</div>
                <div className="text-white/50 text-sm">Active Fans</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Your own website-style profile</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Distribute to Spotify, Apple Music & more</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Keep 70% of your earnings</span>
              </p>
              <p className="flex items-center gap-3 text-white/60">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Verified-only community, no fake accounts</span>
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
                Every account is verified. Every creator is real. Every VIBE is authentic. This is your stage."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}