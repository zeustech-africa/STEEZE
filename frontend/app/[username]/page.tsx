"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function UsernameRedirect() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  useEffect(() => {
    if (username) {
      router.replace(`/creator/${encodeURIComponent(username)}`);
    }
  }, [username, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Sparkles className="text-gold animate-pulse" size={32} />
      <p className="text-gold text-lg">Redirecting to @{username}...</p>
    </div>
  );
}