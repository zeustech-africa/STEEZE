"use client";

import { useState, useEffect } from "react";
import { Search, Music, Laugh, Video, Drama, Sparkles } from "lucide-react";

const topics = [
  { id: "for-you", name: "For You", icon: Sparkles },
  { id: "following", name: "Following", icon: null },
  { id: "music", name: "Music", icon: Music },
  { id: "comedy", name: "Comedy", icon: Laugh },
  { id: "dance", name: "Dance", icon: Video },
  { id: "drama", name: "Drama", icon: Drama },
];

interface TopFeedSwitcherProps {
  activeFeed: string;
  onFeedChange: (feed: string) => void;
  onSearchClick: () => void;
}

export default function TopFeedSwitcher({ activeFeed, onFeedChange, onSearchClick }: TopFeedSwitcherProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`sticky top-0 z-40 pt-12 pb-2 transition-all ${isScrolled ? "glass" : "bg-transparent"}`}>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onFeedChange(topic.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeFeed === topic.id
                  ? "bg-gold text-black font-semibold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {topic.icon && <topic.icon size={16} />}
              <span className="text-sm">{topic.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onSearchClick}
          className="p-2 rounded-full bg-white/10 text-white/70 hover:text-gold transition-all"
        >
          <Search size={20} />
        </button>
      </div>
    </div>
  );
}