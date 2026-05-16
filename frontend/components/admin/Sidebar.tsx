"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  Users,
  Send,
  DollarSign,
  Logs,
  Settings,
  Radio,
  Shield,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/verification", label: "Verification", icon: UserCheck },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/distribution", label: "Distribution", icon: Send },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/broadcast", label: "Broadcast", icon: Radio },
  { href: "/admin/security", label: "Security", icon: Shield },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/logs", label: "Audit Logs", icon: Logs },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield className="text-gold" size={24} />
          <div>
            <h1 className="text-white font-bold text-lg">STEEZE</h1>
            <p className="text-white/40 text-xs">Admin Control Room</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/20 text-xs text-center">
          ZeusLiveStudio © 2026
        </p>
      </div>
    </aside>
  );
};

export default AdminSidebar;