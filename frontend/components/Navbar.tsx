"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Bell, BarChart3, LogOut, Settings, User, MessageCircle } from "lucide-react";
import GetStartedModal from "./GetStartedModal";
import LoginModal from "./LoginModal";
import NotificationCenter from "./notifications/NotificationCenter";
import { useAuthStore } from "@/stores";
import { useJustVibes } from "@/hooks/useJustVibes";
import { JustVibesTimer } from "@/components/JustVibesTimer";

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const userId = user?.id ?? null;
  const userType = user?.userType ?? null;
  const isLoggedIn = isAuthenticated;
  const { isAuthenticated: isJustVibesAuth } = useJustVibes();

  // Fetch unread message count for notification badge
  useEffect(() => {
    if (!isLoggedIn) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setUnreadMessageCount(data.total || 0);
        }
      } catch (error) {
        // silently fail — non-critical UI feature
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for the custom event dispatched from GetStartedModal to open LoginModal
  useEffect(() => {
    const handleOpenLogin = () => {
      setIsGetStartedModalOpen(false);
      setIsLoginModalOpen(true);
    };
    window.addEventListener("openLoginModal", handleOpenLogin);
    return () => window.removeEventListener("openLoginModal", handleOpenLogin);
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "For Creators", href: "#creators" },
    { name: "For Fans", href: "#fans" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Advertise", href: "/advertise" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? "glass py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/icons/steeze-logo-horizontal.png"
              alt="STEEZE"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-label={link.name}
                className="text-white/80 hover:text-gold transition-colors duration-300 font-medium"
              >
                {link.name}
              </Link>
            ))}
            {(userType === 'zls_artist' || userType === 'independent_creator') && (
              <Link href="/analytics" aria-label="Analytics" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                <BarChart3 size={16} aria-hidden="true" /> Analytics
              </Link>
            )}
            {userId && <NotificationCenter userId={userId} apiBase="/api/creators" />}
            {userId && (
              <Link href="/inbox" aria-label="Inbox" className="relative text-white/80 hover:text-gold transition-colors">
                <MessageCircle size={20} aria-hidden="true" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-gold text-black text-xs rounded-full flex items-center justify-center">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
              </Link>
            )}
            {/* Just VIBES timer */}
            {isJustVibesAuth && <JustVibesTimer />}
            {isLoggedIn ? (
              <>
                <Link href="/profile" aria-label="Profile" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                  <User size={16} aria-hidden="true" /> Profile
                </Link>
                <Link href="/settings" aria-label="Settings" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                  <Settings size={16} aria-hidden="true" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="px-5 py-2 border border-red-500/50 rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 flex items-center gap-1"
                >
                  <LogOut size={16} aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/install"
                  aria-label="Get App"
                  className="px-3 py-1 border border-gold/50 text-gold rounded-full text-sm hover:bg-gold hover:text-black transition-all"
                >
                  Get App
                </Link>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  aria-label="Login"
                  className="px-5 py-2 border border-white/30 rounded-full text-white hover:border-gold hover:text-gold transition-all duration-300"
                >
                  ENTER THE VIBES
                </button>
                <button
                  onClick={() => setIsGetStartedModalOpen(true)}
                  aria-label="Get Started"
                  className="px-5 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
                >
                  GET STEEZE
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden text-white"
          >
            {isMobileMenuOpen ? <X size={28} aria-hidden="true" /> : <Menu size={28} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass absolute top-full left-0 w-full py-5 px-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-label={link.name}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white/80 hover:text-gold transition-colors py-2"
              >
                {link.name}
              </Link>
            ))}
            {(userType === 'zls_artist' || userType === 'independent_creator') && (
              <Link href="/analytics" aria-label="Analytics" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-gold transition-colors py-2 flex items-center gap-1">
                <BarChart3 size={16} aria-hidden="true" /> Analytics
              </Link>
            )}
            {/* Just VIBES timer in mobile */}
            {isJustVibesAuth && <JustVibesTimer />}
            <Link
              href="/install"
              aria-label="Get App"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-1 border border-gold/50 text-gold rounded-full text-sm hover:bg-gold hover:text-black transition-all text-center inline-block"
            >
              Get App
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLoginModalOpen(true);
              }}
              aria-label="Login"
              className="px-5 py-2 border border-white/30 rounded-full text-white text-center hover:border-gold"
            >
              ENTER THE VIBES
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsGetStartedModalOpen(true);
              }}
              aria-label="Get Started"
              className="px-5 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full text-center"
            >
              GET STEEZE
            </button>
          </div>
        )}
      </nav>

      {/* Modals */}
      <GetStartedModal
        isOpen={isGetStartedModalOpen}
        onClose={() => setIsGetStartedModalOpen(false)}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToGetStarted={() => {
          setIsLoginModalOpen(false);
          setIsGetStartedModalOpen(true);
        }}
      />
    </>
  );
};

export default Navbar;