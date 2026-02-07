"use client";

import { supabase } from "@/lib/supabase/client";
import { useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";

type Profile = {
  id: string;
  avatar_url: string | null;
};

export default function ProfileAvatar({
  profile,
  onAvatarUpdate,
}: {
  profile: Profile;
  onAvatarUpdate: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      console.log("📤 Uploading to:", filePath);

      // Upload new avatar (upsert will replace if exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      console.log("✅ Upload successful:", uploadData);

      // Get public URL (without cache buster for database)
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log("🔗 Public URL:", publicUrl);

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        alert(`Failed to update profile: ${updateError.message}`);
        setUploading(false);
        return;
      }

      console.log("✅ Profile updated in database");

      // Update UI with cache buster to force reload
      onAvatarUpdate(`${publicUrl}?t=${Date.now()}`);
      
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {profile.avatar_url ? (
          <img
            key={profile.avatar_url} // Force re-render when URL changes
            src={profile.avatar_url}
            className="w-full h-full object-cover"
            alt="Profile avatar"
            onError={(e) => {
              console.error("❌ Image failed to load:", profile.avatar_url);
              e.currentTarget.style.display = "none";
            }}
            onLoad={() => {
              console.log("✅ Image loaded successfully");
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-purple-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center ${
            uploading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Gradient ring on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-200 -z-10" />

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/jpg,image/webp"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadAvatar(file);
          }
          // Reset input
          e.target.value = "";
        }}
      />
    </div>
  );
}