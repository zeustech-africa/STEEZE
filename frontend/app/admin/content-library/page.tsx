"use client";

import { useEffect, useState } from "react";
import { Database, Search, Filter, Play, Image, Music, Video, User, Calendar, ChevronDown } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  creator?: { username: string; artistName: string };
  createdAt: string;
  viewCount: number;
  likeCount: number;
  adminStatus: string;
}

const ContentLibraryPage = () => {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        search,
        type: typeFilter,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/content-library?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContent(); }, [search, typeFilter, page]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video size={16} />;
      case "music": return <Music size={16} />;
      case "image": return <Image size={16} />;
      default: return <Play size={16} />;
    }
  };

  const totalPages = Math.ceil(total / limit);
  const postTypes = ["all", "video", "music", "image", "text"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="text-gold" size={28} /> Content Library
        </h1>
        <p className="text-white/50 mt-1">{total} total posts in archive</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50 transition"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50 pr-8"
          >
            {postTypes.map((t) => (
              <option key={t} value={t} className="bg-black">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        <button
          onClick={fetchContent}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-sm transition"
        >
          <Filter size={14} className="inline mr-1" /> Refresh
        </button>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <Database className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/60 text-lg">No content found matching your criteria.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Content</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Creator</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Type</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Views</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Likes</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Status</th>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase">Published</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                          {getTypeIcon(post.type)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium line-clamp-1">{post.title || "Untitled"}</p>
                          <p className="text-white/30 text-xs line-clamp-1">{post.description?.slice(0, 60) || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-white/30" />
                        <span className="text-white/60 text-sm">{post.creator?.artistName || post.creator?.username || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-white/50 text-sm flex items-center gap-1.5">
                        {getTypeIcon(post.type)} {post.type}
                      </span>
                    </td>
                    <td className="p-4 text-white/50 text-sm">{post.viewCount?.toLocaleString() || 0}</td>
                    <td className="p-4 text-white/50 text-sm">{post.likeCount?.toLocaleString() || 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                        post.adminStatus === "approved_global" ? "bg-green-500/20 text-green-400" :
                        post.adminStatus === "approved_profile" ? "bg-blue-500/20 text-blue-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {post.adminStatus?.replace(/_/g, " ") || "pending"}
                      </span>
                    </td>
                    <td className="p-4 text-white/30 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-white/30 text-xs">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-white/5 text-white/50 text-xs hover:bg-white/10 disabled:opacity-30 transition"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-white/5 text-white/50 text-xs hover:bg-white/10 disabled:opacity-30 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentLibraryPage;