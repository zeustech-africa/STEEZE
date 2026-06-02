"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Music, Mic, Palette, Gamepad, Bike, Shirt, Plane, Coffee, Cpu } from "lucide-react";

interface Topic {
  name: string;
  value: number;
  key: string;
  icon: React.ReactNode;
}

export default function TopicsSettingsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/feed/topics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const iconMap: Record<string, React.ReactNode> = {
          Music: <Music size={20} />,
          Comedy: <Mic size={20} />,
          Dance: <Palette size={20} />,
          Education: <Palette size={20} />,
          Gaming: <Gamepad size={20} />,
          Sports: <Bike size={20} />,
          Fashion: <Shirt size={20} />,
          Travel: <Plane size={20} />,
          Food: <Coffee size={20} />,
          Technology: <Cpu size={20} />
        };
        const topicsWithIcons = data.topics.map((t: any) => ({
          ...t,
          icon: iconMap[t.name] || <Palette size={20} />
        }));
        setTopics(topicsWithIcons);
      }
    } catch (error) {
      console.error("Fetch topics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTopic = (index: number, value: number) => {
    const updated = [...topics];
    updated[index].value = value;
    setTopics(updated);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/feed/topics`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ topics: topics.map(t => ({ key: t.key, value: t.value })) })
      });

      if (response.ok) {
        alert("Preferences saved successfully!");
        router.back();
      }
    } catch (error) {
      console.error("Save topics error:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
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
          <h1 className="text-white text-2xl font-bold">Content Preferences</h1>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <p className="text-white/60 text-sm mb-6">
            Adjust the sliders to control how much of each content type you see in your feed.
            Drag left (See Less) or right (See More).
          </p>

          <div className="space-y-6">
            {topics.map((topic, index) => (
              <div key={topic.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {topic.icon}
                    <span className="text-white font-medium">{topic.name}</span>
                  </div>
                  <span className="text-gold text-sm font-medium">{topic.value}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={topic.value}
                  onChange={(e) => updateTopic(index, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <div className="flex justify-between text-white/30 text-xs">
                  <span>See Less</span>
                  <span>Balanced</span>
                  <span>See More</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={savePreferences}
            disabled={saving}
            className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}