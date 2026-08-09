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

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be under 4MB");
      return;
    }

    setUploading(true);

    try {
      let finalAvatarUrl: string | null = null;

      // Try uploading to Supabase storage first
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          finalAvatarUrl = urlData.publicUrl;
        }
      } catch (storageErr) {
        console.warn("⚠️ Supabase storage upload warning, using Base64 fallback:", storageErr);
      }

      // If storage upload failed or returned null, use Base64 Data URL fallback
      if (!finalAvatarUrl) {
        finalAvatarUrl = await readAsDataURL(file);
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: finalAvatarUrl })
        .eq("id", profile.id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        alert(`Failed to update profile picture: ${updateError.message}`);
        setUploading(false);
        return;
      }

      // Update UI state immediately
      onAvatarUpdate(finalAvatarUrl);
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("❌ Unexpected error updating avatar:", error);
      alert("Failed to update profile photo. Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" title="Click to change profile picture">
      <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/40 dark:border-white/20 shadow-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        {profile.avatar_url ? (
          <img
            key={profile.avatar_url}
            src={profile.avatar_url}
            className="w-full h-full object-cover rounded-full"
            alt="Profile avatar"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <User className="w-5 h-5 text-purple-600 dark:text-purple-300" />
        )}

        {/* Hover overlay */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full ${
            uploading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

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