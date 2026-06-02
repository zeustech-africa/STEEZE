"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import TemplateRenderer from "@/components/creator/TemplateRenderer";

interface CreatorProfileClientProps {
  initialCreator: Record<string, unknown>;
  username: string;
}

// API functions
const fetchCreator = async (username: string) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const response = await fetch(`${API_URL}/api/creators/${username}`);
  if (!response.ok) throw new Error("Failed to fetch creator");
  const data = await response.json();
  return data.creator;
};

const fetchFollowStatus = async (creatorId: string) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const response = await fetch(`${API_URL}/api/user/following/${creatorId}`);
  if (!response.ok) return { isFollowing: false };
  const data = await response.json();
  return { isFollowing: data.isFollowing };
};

export default function CreatorProfileClient({
  initialCreator,
  username,
}: CreatorProfileClientProps) {
  const [isCreator, setIsCreator] = useState(false);
  const [previewAsFan, setPreviewAsFan] = useState(false);
  const [templateId, setTemplateId] = useState<string>("icon");
  const queryClient = useQueryClient();

  // Use React Query with ISR data as initialData
  const { data: creator } = useQuery({
    queryKey: queryKeys.creator(username),
    queryFn: () => fetchCreator(username),
    initialData: initialCreator,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Follow status query (only when logged in)
  const { data: followStatus } = useQuery({
    queryKey: ["followStatus", creator?.id],
    queryFn: () => fetchFollowStatus(creator?.id as string),
    enabled: !!creator?.id,
    staleTime: 1000 * 60,
  });

  // Follow mutation with optimistic update
  const followMutation = useMutation({
    mutationFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${API_URL}/api/user/follow/${creator?.id}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Failed to follow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followStatus", creator?.id] });
    },
  });

  // Check if current user is the creator
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsCreator(
          user.username === username || user.artistName === username
        );
      } catch {
        // ignore parse errors
      }
    }
  }, [username]);

  // Fetch user's template preference
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${API_URL}/api/user/template`);
        if (response.ok) {
          const data = await response.json();
          setTemplateId(data.templateId || "icon");
        }
      } catch (error) {
        console.error("Failed to fetch template:", error);
      }
    };

    fetchTemplate();
  }, []);

  if (!creator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Creator not found</div>
      </div>
    );
  }

  return (
    <TemplateRenderer
      creator={creator}
      isCreator={isCreator}
      previewAsFan={previewAsFan}
      followStatus={followStatus}
      onFollow={
        followStatus?.isFollowing === false
          ? () => followMutation.mutate()
          : undefined
      }
      isFollowLoading={followMutation.isPending}
      templateId={templateId}
    />
  );
}