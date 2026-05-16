"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Bell, BarChart3, LogOut, Settings, User } from "lucide-react";
import GetStartedModal from "./GetStartedModal";
import LoginModal from "./LoginModal";
import NotificationCenter from "./notifications/NotificationCenter";

const Navbar = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id || null);
        setUserType(user.userType || null);
      } catch {
        setUserId(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserId(null);
    setUserType(null);
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
                className="text-white/80 hover:text-gold transition-colors duration-300 font-medium"
              >
                {link.name}
              </Link>
            ))}
            {(userType === 'zls_artist' || userType === 'independent_creator') && (
              <Link href="/analytics" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                <BarChart3 size={16} /> Analytics
              </Link>
            )}
            {userId && <NotificationCenter userId={userId} apiBase="/api/creators" />}
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                  <User size={16} /> Profile
                </Link>
                <Link href="/settings" className="text-white/80 hover:text-gold transition-colors duration-300 font-medium flex items-center gap-1">
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 border border-red-500/50 rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 flex items-center gap-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-5 py-2 border border-white/30 rounded-full text-white hover:border-gold hover:text-gold transition-all duration-300"
                >
                  Login
                </button>
                <button
                  onClick={() => setIsGetStartedModalOpen(true)}
                  className="px-5 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
                >
                  Get Started
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
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white/80 hover:text-gold transition-colors py-2"
              >
                {link.name}
              </Link>
            ))}
            {(userType === 'zls_artist' || userType === 'independent_creator') && (
              <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-gold transition-colors py-2 flex items-center gap-1">
                <BarChart3 size={16} /> Analytics
              </Link>
            )}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLoginModalOpen(true);
              }}
              className="px-5 py-2 border border-white/30 rounded-full text-white text-center hover:border-gold"
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsGetStartedModalOpen(true);
              }}
              className="px-5 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full text-center"
            >
              Get Started
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
