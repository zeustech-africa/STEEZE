"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Shield, Sparkles, Crown, Users, Heart, Music, Video, Star, CheckCircle } from "lucide-react";
import { login } from "@/lib/auth-client";
import Captcha from "@/components/Captcha";
import { LoginInterstitialAd } from "@/components/ads/LoginInterstitialAd";
import { useAuthStore } from "@/stores/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<any>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!captchaToken) {
        setError("Please complete the CAPTCHA verification");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, cfTurnstileResponse: captchaToken }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.user.role === "admin") {
          setError("Admin login is not available here. Please use the admin portal.");
          return;
        }

        // Store only non-sensitive user data in localStorage (tokens are HttpOnly cookies)
        localStorage.setItem("user", JSON.stringify(data.user));

        // Determine redirect path based on user type
        let path = "/";
        if (data.user.userType === "independent_creator" || data.user.userType === "zls_artist") {
          path = `/creator/${data.user.username || data.user.artistName}`;
        }
        setRedirectPath(path);

        // Check if user should see interstitial ad (only Free and Basic users)
        const userTier = data.user.subscriptionTier;
        const shouldShowInterstitial = !userTier || userTier === "free" || userTier === "basic";
        
        if (shouldShowInterstitial) {
          setLoginSuccess(true);
          // Fetch interstitial ad
          try {
            const adRes = await fetch(`${API_BASE}/api/ad/placement?placement=login_interstitial`, {
              credentials: "include",
            });
            const adData = await adRes.json();
            if (adData.campaign) {
              setInterstitialAd(adData.campaign);
              setShowInterstitialAd(true);
              setLoading(false);
              return;
            }
          } catch (adErr) {
            console.error("Failed to fetch interstitial ad:", adErr);
          }
          // No ad available, redirect directly
          router.push(path);
          return;
        }

        router.push(path);
      } else {
        setError(data.error || data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Show interstitial ad if available
  if (showInterstitialAd && interstitialAd) {
    return (
      <LoginInterstitialAd
        campaign={interstitialAd}
        onComplete={() => {
          setShowInterstitialAd(false);
          router.push(redirectPath);
        }}
        onSkip={() => {
          setShowInterstitialAd(false);
          router.push(redirectPath);
        }}
      />
    );
  }

  // MOBILE: Simple centered form (keep existing clean design)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-gold/10 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1000ms" }} />
        </div>

        <div className="glass-card p-8 w-full max-w-md relative z-10 border-t-2 border-gold">
          {/* Header with STEEZE branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Crown className="text-gold" size={28} />
              <span className="text-gold text-2xl font-bold tracking-wider">STEEZE</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to the Future</h1>
            <p className="text-white/50 text-sm">Sign in to your STEEZE account</p>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 mb-6 text-xs">
            <div className="flex items-center gap-1 text-white/50"><Shield size={12} className="text-gold" /> Verified Only</div>
            <div className="flex items-center gap-1 text-white/50"><Users size={12} className="text-gold" /> Real Creators</div>
            <div className="flex items-center gap-1 text-white/50"><Heart size={12} className="text-gold" /> Pure Entertainment</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="email-mobile">Email Address</label>
              <input
                id="email-mobile"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="password-mobile">Password</label>
              <div className="relative">
                <input
                  id="password-mobile"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-gold transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Captcha
                onVerify={setCaptchaToken}
                onError={() => setCaptchaError(true)}
              />
            </div>
            {captchaError && (
              <p className="text-red-400 text-xs text-center mt-1">CAPTCHA verification failed. Please try again.</p>
            )}

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg" role="alert">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Don't have an account?{" "}
              <Link href="/signup/creator" className="text-gold hover:underline font-semibold">
                Join as Creator
              </Link>{" "}
              or{" "}
              <Link href="/signup/vibes" className="text-gold hover:underline font-semibold">
                Join as VIBE
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-gold hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
            </p>
          </div>

          {/* Information banner */}
          <div className="mt-4 p-3 bg-gold/5 border border-gold/20 rounded-lg">
            <p className="text-white/50 text-xs text-center">
              ⚡ STEEZE is the future of entertainment. No fake accounts. No politics. Just pure content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP: Split layout with marketing content
  return (
    <div className="min-h-screen bg-black">
      <div className="grid md:grid-cols-2 min-h-screen">
        {/* LEFT SIDE: Marketing Content with background image */}
        <div className="relative bg-gradient-to-br from-black via-black/90 to-gold/10 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/auth-bg.jpg"
              alt="STEEZE Entertainment"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>
          <div className="relative z-10 px-12 py-16 max-w-lg mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <Crown className="text-gold" size={36} />
                <span className="text-gold text-3xl font-bold tracking-wider">STEEZE</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Welcome to the <span className="text-gold">Future</span> of Entertainment
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Sign in to access pure, verified entertainment. No fake accounts. No politics. Just the content you love.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">10K+</div>
                <div className="text-white/50 text-xs">Verified Creators</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">1M+</div>
                <div className="text-white/50 text-xs">Hours of Content</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-gold">50K+</div>
                <div className="text-white/50 text-xs">Active Fans</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3">
              <p className="flex items-center gap-3 text-white/70">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Every account is ID + selfie verified</span>
              </p>
              <p className="flex items-center gap-3 text-white/70">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Premium content from real creators only</span>
              </p>
              <p className="flex items-center gap-3 text-white/70">
                <CheckCircle size={20} className="text-gold shrink-0" />
                <span>Powered by ZeusLiveStudio technology</span>
              </p>
            </div>

            {/* Powered by */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/30 text-xs uppercase tracking-widest">Powered by ZeusLiveStudio</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="flex items-center justify-center px-8 py-12 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <div className="glass-card p-8 border-t-2 border-gold">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                <p className="text-white/50 text-sm">Access your STEEZE account</p>
              </div>

              {/* Trust badges */}
              <div className="flex justify-center gap-4 mb-6 text-xs">
                <div className="flex items-center gap-1 text-white/50"><Shield size={12} className="text-gold" /> Verified Only</div>
                <div className="flex items-center gap-1 text-white/50"><Users size={12} className="text-gold" /> Real Creators</div>
                <div className="flex items-center gap-1 text-white/50"><Heart size={12} className="text-gold" /> Pure Entertainment</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-gold transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-gold text-sm hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <div className="flex justify-center">
                  <Captcha
                    onVerify={setCaptchaToken}
                    onError={() => setCaptchaError(true)}
                  />
                </div>
                {captchaError && (
                  <p className="text-red-400 text-xs text-center mt-1">CAPTCHA verification failed. Please try again.</p>
                )}

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg" role="alert">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg hover:shadow-gold/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/50 text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup/creator" className="text-gold hover:underline font-semibold">
                    Join as Creator
                  </Link>{" "}
                  or{" "}
                  <Link href="/signup/vibes" className="text-gold hover:underline font-semibold">
                    Join as VIBE
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-white/30 text-xs">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" className="text-gold hover:underline">Terms</Link> and{" "}
                  <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                </p>
              </div>

              {/* Information banner */}
              <div className="mt-4 p-3 bg-gold/5 border border-gold/20 rounded-lg">
                <p className="text-white/50 text-xs text-center">
                  ⚡ STEEZE is the future of entertainment. No fake accounts. No politics. Just pure content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
