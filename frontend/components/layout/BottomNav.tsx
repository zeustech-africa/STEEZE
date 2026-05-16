"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, User, Camera, Image, BarChart3 } from "lucide-react";
import { useState } from "react";

interface BottomNavProps {
  isCreator: boolean;
  onUploadClick: () => void;
}

export default function BottomNav({ isCreator, onUploadClick }: BottomNavProps) {
  const pathname = usePathname();
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const navItems = [
    { name: "Home", icon: Home, href: "/", active: pathname === "/" },
    { name: "Discover", icon: Compass, href: "/explore", active: pathname === "/explore" },
    { name: "Create", icon: Plus, href: "#", active: false, isButton: true },
    { name: "Inbox", icon: MessageCircle, href: "/inbox", active: pathname === "/inbox" },
    { name: "Profile", icon: User, href: "/profile", active: pathname === "/profile" },
    ...(isCreator ? [{ name: "Analytics", icon: BarChart3, href: "/analytics", active: pathname === "/analytics" }] : []),
  ];

  const handleCreateClick = () => {
    if (isCreator) {
      setShowUploadMenu(!showUploadMenu);
    }
  };

  return (
    <>
      <nav role="navigation" aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 py-2 px-4">
        <div className="container mx-auto max-w-lg flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isButton) {
              return (
                <button
                  key={item.name}
                  onClick={handleCreateClick}
                  aria-label="Create content (camera or upload)"
                  className="relative -top-3 w-14 h-14 rounded-full bg-gradient-to-r from-gold to-gold-dark flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon size={28} className="text-black" aria-hidden="true" />
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                aria-current={item.active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-all ${
                  item.active ? "text-gold" : "text-white/60 hover:text-white"
                }`}
              >
                <Icon size={22} aria-hidden="true" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {showUploadMenu && isCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowUploadMenu(false)}
        >
          <div className="glass-card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gold mb-4 text-center">Create Content</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("openCameraModal"));
                  setShowUploadMenu(false);
                }}
                aria-label="Open camera to take a photo or video"
                className="p-4 bg-white/10 rounded-xl text-center hover:bg-gold/20 transition-all"
              >
                <Camera className="mx-auto mb-2 text-gold" size={28} aria-hidden="true" />
                <span className="text-white text-sm">Camera</span>
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("openUploadModal"));
                  setShowUploadMenu(false);
                }}
                aria-label="Upload photo or video from your device"
                className="p-4 bg-white/10 rounded-xl text-center hover:bg-gold/20 transition-all"
              >
                <Image className="mx-auto mb-2 text-gold" size={28} aria-hidden="true" />
                <span className="text-white text-sm">Upload</span>
              </button>
            </div>
            <button
              onClick={() => setShowUploadMenu(false)}
              aria-label="Close create content menu"
              className="mt-4 w-full py-2 border border-white/30 text-white/70 rounded-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}