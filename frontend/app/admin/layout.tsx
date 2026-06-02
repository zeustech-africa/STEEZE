"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, FileText, CheckSquare, DollarSign,
  Bell, Calendar, Shield, Settings, LogOut, Crown,
  MessageCircle, Repeat, BarChart3, Activity, Database, Flag,
  Menu, X, Server, AlertTriangle,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, badge: null },
  { name: "Users", href: "/admin/users", icon: Users, badge: null },
  { name: "Posts", href: "/admin/posts", icon: FileText, badge: null },
  { name: "Verification", href: "/admin/verification", icon: CheckSquare, badge: null },
  { name: "Contracts", href: "/admin/contracts", icon: Crown, badge: null },
  { name: "Reports", href: "/admin/reports", icon: Flag, badge: null },
  { name: "Appeals", href: "/admin/appeals", icon: MessageCircle, badge: null },
  { name: "Revenue", href: "/admin/revenue", icon: DollarSign, badge: null },
  { name: "Payouts", href: "/admin/payouts", icon: DollarSign, badge: null },
  { name: "Distribution", href: "/admin/distribution", icon: Repeat, badge: null },
  { name: "Broadcast", href: "/admin/broadcast", icon: Bell, badge: null },
  { name: "Calendar", href: "/admin/calendar", icon: Calendar, badge: null },
  { name: "Content Library", href: "/admin/content-library", icon: Database, badge: null },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, badge: null },
  { name: "Security", href: "/admin/security", icon: Shield, badge: null },
  { name: "Moderation Rules", href: "/admin/moderation-rules", icon: Activity, badge: null },
  { name: "Logs", href: "/admin/logs", icon: Server, badge: null },
  { name: "Settings", href: "/admin/settings", icon: Settings, badge: null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      setLoading(false);
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        router.push("/");
        return;
      }
      setAuthorized(true);
    } catch {
      router.push("/admin/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 w-64 h-screen border-r border-white/10 bg-black/95 backdrop-blur-xl overflow-y-auto transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="text-gold text-xl font-bold" onClick={() => setSidebarOpen(false)}>
            STEEZE Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-gold transition-all text-sm"
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-red-500 transition-all mt-4 text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
          <h1 className="text-gold font-bold">STEEZE Admin</h1>
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={24} />
          </button>
        </div>
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}