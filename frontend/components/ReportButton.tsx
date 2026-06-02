"use client";

import { useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import ReportContentModal from "./ReportContentModal";

interface ReportButtonProps {
  targetType: "post" | "comment" | "user";
  targetId: string;
  targetTitle?: string;
  onReport?: () => void;
  variant?: "icon" | "text" | "menu";
}

export default function ReportButton({
  targetType,
  targetId,
  targetTitle,
  onReport,
  variant = "menu"
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variant === "menu") {
      setIsOpen(!isOpen);
    } else {
      setShowModal(true);
    }
  };

  const handleReport = () => {
    setShowModal(true);
    setIsOpen(false);
    if (onReport) onReport();
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleClick}
          className="p-1 text-white/40 hover:text-red-400 transition-all"
          aria-label="Report content"
        >
          <Flag size={16} />
        </button>
        <ReportContentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          targetType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          onSuccess={handleReport}
        />
      </>
    );
  }

  if (variant === "menu") {
    return (
      <>
        <div className="relative">
          <button
            onClick={handleClick}
            className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm"
          >
            <Flag size={16} className="text-red-400" />
            Report
          </button>
          {isOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden">
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2 text-sm"
              >
                <Flag size={16} className="text-red-400" />
                Report this content
              </button>
            </div>
          )}
        </div>
        <ReportContentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          targetType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
          onSuccess={() => {
            setIsOpen(false);
            if (onReport) onReport();
          }}
        />
      </>
    );
  }

  // variant "text"
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-all text-sm"
      >
        <Flag size={14} /> Report
      </button>
      <ReportContentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        onSuccess={onReport}
      />
    </>
  );
}