"use client";

import Link from "next/link";

interface HashtagProps {
  tag: string;
  className?: string;
}

export default function Hashtag({ tag, className = "" }: HashtagProps) {
  const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;

  return (
    <Link
      href={`/explore?hashtag=${encodeURIComponent(cleanTag)}`}
      className={`text-gold hover:underline transition-all ${className}`}
    >
      #{cleanTag}
    </Link>
  );
}