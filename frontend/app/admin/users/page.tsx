"use client";

import { useEffect, useState } from "react";
import { Users, Search, Ban, UserX, Trash2, ShieldAlert } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  artistName: string;
  isVerified: boolean;
  verificationStatus: string;
  isBanned?: boolean;
  isSuspended?: boolean;
  createdAt: string;
  posts: { id: string }[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const banUser = async (userId: string) => {
    if (!confirm("Ban this user? They will be unable to access the platform.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm("Suspend this user? Their account will be temporarily disabled.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (error) {
      console.error("Failed to suspend user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("PERMANENTLY DELETE this user and ALL their content? This cannot be undone.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.artistName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-white/50 mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
        >
          <option value="all">All Roles</option>
          <option value="creator">Creators</option>
          <option value="fan">Fans</option>
          <option value="admin">Admins</option>
        </select>
        <button
          onClick={fetchUsers}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          Refresh
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/50">No users found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Posts</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Joined</th>
                  <th className="text-right p-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">
                          {user.artistName || user.email?.split("@")[0]}
                        </p>
                        <p className="text-white/30 text-xs">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === "admin"
                          ? "bg-red-500/20 text-red-400"
                          : user.role === "creator"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-white/10 text-white/60"
                      } capitalize`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.isBanned
                          ? "bg-red-500/20 text-red-400"
                          : user.isSuspended
                          ? "bg-yellow-500/20 text-yellow-400"
                          : user.isVerified
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/10 text-white/40"
                      }`}>
                        {user.isBanned ? "Banned" : user.isSuspended ? "Suspended" : user.isVerified ? "Verified" : user.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-white/40 text-sm">{user.posts?.length || 0}</td>
                    <td className="p-4 text-white/30 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => suspendUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition disabled:opacity-50"
                          title="Suspend"
                        >
                          <UserX size={14} />
                        </button>
                        <button
                          onClick={() => banUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                          title="Ban"
                        >
                          <Ban size={14} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50"
                          title="Delete Permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;