"use client";

import { useState } from "react";
import {
  Play,
  Image,
  Music,
  FileText,
  Globe,
  User,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface Creator {
  artistName: string;
  profilePicUrl: string;
  distributionSettings?: {
    distrokidEnabled: boolean;
    youtubeEnabled: boolean;
    spotifyEnabled: boolean;
    appleMusicEnabled: boolean;
    tidalEnabled: boolean;
  } | null;
}

interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl: string;
  price: number;
  isFree: boolean;
  autoScanStatus: string;
  autoScanReason: string | null;
  creator: Creator;
  createdAt: string;
}

interface PostApprovalCardProps {
  post: Post;
  onApproveGlobal: (id: string) => void;
  onApproveProfile: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
}

const PostApprovalCard = ({
  post,
  onApproveGlobal,
  onApproveProfile,
  onReject,
  onDelete,
}: PostApprovalCardProps) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typeIcons: Record<string, any> = {
    music: Music,
    video: Play,
    image: Image,
    text: FileText,
  };

  const TypeIcon = typeIcons[post.type] || FileText;

  const getAutoScanBadge = () => {
    if (post.autoScanStatus === "passed") {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
          <ShieldCheck size={12} />
          Auto-Scan Passed
        </span>
      );
    }
    if (post.autoScanStatus === "failed") {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
          <ShieldAlert size={12} />
          Auto-Scan Failed
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
        Auto-Scan Pending
      </span>
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-purple-600 flex items-center justify-center">
              <TypeIcon size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold text-sm">{post.title}</h4>
                {getAutoScanBadge()}
              </div>
              <p className="text-white/30 text-xs">
                by {post.creator?.artistName || "Unknown Creator"} · {post.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                post.isFree
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gold/20 text-gold"
              }`}
            >
              {post.isFree ? "Free" : `R ${post.price}`}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-white/30 hover:text-white text-xs transition"
            >
              {expanded ? "Less" : "More"}
            </button>
          </div>
        </div>

        {/* Description */}
        {post.description && (
          <p
            className={`text-white/50 text-xs mb-3 ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {post.description}
          </p>
        )}

        {/* Auto-scan failure reason */}
        {post.autoScanStatus === "failed" && post.autoScanReason && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-[11px]">{post.autoScanReason}</p>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-3 mb-3 pt-3 border-t border-white/10">
            {/* Media Preview */}
            {post.mediaUrl && (
              <div>
                <p className="text-white/20 text-[10px] uppercase tracking-wider mb-1">
                  Media
                </p>
                {post.type === "video" || post.type === "music" ? (
                  <div className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center">
                        <Play size={24} className="text-white/20" />
                      </div>
                    )}
                    <a
                      href={post.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/60 hover:text-white transition"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-32 object-cover rounded-lg border border-white/10"
                  />
                )}
              </div>
            )}

            {/* Distribution Settings */}
            {post.creator?.distributionSettings && (
              <div>
                <p className="text-white/20 text-[10px] uppercase tracking-wider mb-1">
                  Creator Distribution Channels
                </p>
                <div className="flex flex-wrap gap-1">
                  {post.creator.distributionSettings.distrokidEnabled && (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40">
                      DistroKid
                    </span>
                  )}
                  {post.creator.distributionSettings.youtubeEnabled && (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40">
                      YouTube
                    </span>
                  )}
                  {post.creator.distributionSettings.spotifyEnabled && (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40">
                      Spotify
                    </span>
                  )}
                  {post.creator.distributionSettings.appleMusicEnabled && (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40">
                      Apple Music
                    </span>
                  )}
                  {post.creator.distributionSettings.tidalEnabled && (
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40">
                      Tidal
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Creator info */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden">
                {post.creator?.profilePicUrl ? (
                  <img
                    src={post.creator.profilePicUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={14} className="w-full h-full p-1 text-white/20" />
                )}
              </div>
              <span className="text-white/30 text-xs">
                {post.creator?.artistName || "Unknown"}
              </span>
            </div>

            <p className="text-white/15 text-[10px]">
              Posted: {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
          {showDeleteConfirm ? (
            <div className="flex-1 flex gap-2">
              <p className="text-red-400 text-xs flex items-center">
                Delete this post from everywhere?
              </p>
              <button
                onClick={() => {
                  onDelete(post.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          ) : showReject ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason..."
                className="flex-1 bg-white/5 border border-red-500/30 rounded-lg px-3 py-1.5 text-white placeholder-white/20 text-xs focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    onReject(post.id, rejectReason);
                    setShowReject(false);
                    setRejectReason("");
                  }
                }}
                disabled={!rejectReason.trim()}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition disabled:opacity-30"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowReject(false);
                  setRejectReason("");
                }}
                className="px-2 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onApproveGlobal(post.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-black text-xs font-medium hover:bg-gold/80 transition"
              >
                <Globe size={14} />
                Approve (Global)
              </button>
              <button
                onClick={() => onApproveProfile(post.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition"
              >
                <User size={14} />
                Profile Only
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition"
              >
                <X size={14} />
                Reject
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2 py-2 rounded-lg border border-white/10 text-white/20 text-xs hover:text-red-400 hover:border-red-500/30 transition"
                title="Delete permanently"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostApprovalCard;