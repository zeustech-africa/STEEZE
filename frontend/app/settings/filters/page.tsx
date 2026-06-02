"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Shield } from "lucide-react";

export default function FiltersSettingsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/filters/keywords`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error("Fetch keywords error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim() || newKeyword.length < 2) {
      alert("Keyword must be at least 2 characters");
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/filters/keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ keyword: newKeyword })
      });

      if (response.ok) {
        setKeywords([...keywords, newKeyword.toLowerCase()]);
        setNewKeyword("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add keyword");
      }
    } catch (error) {
      console.error("Add keyword error:", error);
    } finally {
      setAdding(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/filters/keywords/${encodeURIComponent(keyword)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setKeywords(keywords.filter(k => k !== keyword));
      }
    } catch (error) {
      console.error("Remove keyword error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gold">
            ← Back
          </button>
          <h1 className="text-white text-2xl font-bold">Keyword Filters</h1>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/70 text-sm">
                Posts containing these words or hashtags will be hidden from your feed.
                Use this to filter out content you don't want to see.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g., spoiler, politics, or #hashtag"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            />
            <button
              onClick={addKeyword}
              disabled={adding || !newKeyword.trim()}
              className="px-4 py-2 bg-gold text-black rounded-lg font-semibold disabled:opacity-50"
            >
              <Plus size={18} />
            </button>
          </div>

          {keywords.length === 0 ? (
            <p className="text-white/40 text-center py-4">No filters added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white text-sm"
                >
                  <span>{keyword}</span>
                  <button onClick={() => removeKeyword(keyword)} className="text-white/50 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}