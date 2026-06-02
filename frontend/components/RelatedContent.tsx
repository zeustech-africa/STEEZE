"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music, Film, Image as ImageIcon } from "lucide-react";

interface RelatedContentProps {
  postId: string;
  currentPostId: string;
}

interface Content {
  id: string;
  title: string;
  type: string;
  thumbnailUrl: string | null;
  creator: {
    id: string;
    artistName: string;
    fullName: string;
    profilePicUrl: string;
  };
  views: number;
  likes: number;
}

export default function RelatedContent({ postId, currentPostId }: RelatedContentProps) {
  const [related, setRelated] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchRelated();
  }, [postId]);

  const fetchRelated = async () => {
    try {
      const response = await fetch(`${API_URL}/api/discovery/related/${postId}`);
      const data = await response.json();
      if (response.ok) {
        setRelated(data.related || []);
      }
    } catch (error) {
      console.error("Fetch related error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio": return <Music size={16} className="text-gold" />;
      case "video": return <Film size={16} className="text-gold" />;
      default: return <ImageIcon size={16} className="text-gold" />;
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="text-white font-semibold mb-4">You might also like</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-white font-semibold mb-4">You might also like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={`/post/${item.id}`}
            className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all group"
          >
            <div className="aspect-video bg-black/50 relative">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              <p className="text-white/40 text-xs truncate">
                {item.creator.artistName || item.creator.fullName}
              </p>
              <div className="flex items-center gap-2 text-white/30 text-xs mt-1">
                <span>👁 {item.views?.toLocaleString() || 0}</span>
                <span>❤️ {item.likes?.toLocaleString() || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}