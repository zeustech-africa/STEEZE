"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Flame } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const categories = [
  { id: "all", name: "All" },
  { id: "music", name: "Music" },
  { id: "comedy", name: "Comedy" },
  { id: "dance", name: "Dance" },
  { id: "drama", name: "Drama" },
];

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold animate-pulse">Loading search...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (query.length > 0 || category !== "all") {
      performSearch();
    }
  }, [query, category]);

  const fetchTrending = async () => {
    try {
      const res = await fetch("/api/vibes/trending");
      const data = await res.json();
      setTrending(data.posts?.slice(0, 5) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vibes/search?q=${query}&category=${category}`);
      const data = await res.json();
      setResults(data.creators);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${query}&category=${category}`);
    performSearch();
  };

  const clearSearch = () => {
    setQuery("");
    router.push("/search");
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gold mb-6">Search Creators</h1>
        
        <form onSubmit={handleSubmit} role="search" className="relative mb-6">
          <label htmlFor="search-input" className="sr-only">Search creators</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} aria-hidden="true" />
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, or category..."
            className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-gold transition-all"
          />
          {query && (
            <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="flex gap-3 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={`px-4 py-2 rounded-full transition-all ${
                category === cat.id ? "bg-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {!query && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Flame size={18} className="text-gold" aria-hidden="true" /> Trending Now</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trending.map((post) => (
                <Link key={post.id} href={`/creator/${post.creator?.username}`} className="flex-shrink-0 flex items-center gap-2 glass-card px-3 py-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative"><Image src={post.creator?.profilePicUrl || "/icons/steeze-icon-square.png"} alt="" fill className="object-cover" /></div>
                  <span className="text-white text-sm">{post.creator?.artistName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-8"><div className="animate-pulse text-gold">Searching...</div></div>}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12"><p className="text-white/50">No creators found. Try a different search.</p></div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((creator) => (
              <Link key={creator.id} href={`/creator/${creator.username}`}>
                <div className="glass-card p-4 flex items-center gap-4 hover:border-gold transition-all">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image src={creator.profilePicUrl || "/icons/steeze-icon-square.png"} alt={creator.artistName} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{creator.artistName}</h3>
                    <p className="text-white/50 text-sm">@{creator.username}</p>
                    <p className="text-white/40 text-xs">{creator.category} • {creator.followerCount || 0} followers</p>
                  </div>
                  <button className="px-4 py-2 border border-gold text-gold rounded-full text-sm hover:bg-gold hover:text-black transition-all">Follow</button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}