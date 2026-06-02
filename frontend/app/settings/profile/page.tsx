"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import EditProfileModal from "@/components/creator/EditProfileModal";
import BottomNav from "@/components/layout/BottomNav";

export default function SettingsProfilePage() {
  const router = useRouter();
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userType, setUserType] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.id) {
        router.push("/login");
        return;
      }

      setUserType(user.userType || "");

      // Fetch full user data
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setCreator(data.user);
        // Automatically open the edit modal once data is loaded
        setShowEditModal(true);
      }
    } catch (error) {
      console.error("Fetch user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedCreator: any) => {
    setCreator(updatedCreator);
    // Update localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.fullName = updatedCreator.fullName;
      user.artistName = updatedCreator.artistName;
      user.profilePicUrl = updatedCreator.profilePicUrl;
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const handleClose = () => {
    router.push("/settings");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Back link */}
        <Link href="/settings" className="text-white/50 hover:text-gold text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Settings
        </Link>

        <h1 className="text-3xl font-bold text-gold mb-2">Edit Profile</h1>
        <p className="text-white/50 mb-8">Update your profile picture, bio, and personal information</p>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-white/60 text-center">Loading profile editor...</p>
        </div>
      </div>

      <BottomNav isCreator={userType === "creator"} onUploadClick={() => {}} />

      {/* Edit Profile Modal */}
      {creator && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={handleClose}
          creator={creator}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}