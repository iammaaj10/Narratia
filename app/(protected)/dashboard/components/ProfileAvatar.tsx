"use client";

import { supabase } from "@/lib/supabase/client";
import { useRef, useState } from "react";
import { Camera, Loader2, User, X, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
  id: string;
  avatar_url: string | null;
  username?: string;
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    } catch (error) {
      console.error("❌ Unexpected error updating avatar:", error);
      alert("Failed to update profile photo. Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Small Header Avatar Trigger */}
      <div 
        onClick={() => setShowPreviewModal(true)}
        className="relative group cursor-pointer" 
        title="View Profile Photo"
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/40 dark:border-white/20 shadow-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center transition-transform hover:scale-105">
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

          {/* Hover overlay indicator */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
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
          e.target.value = "";
        }}
      />

      {/* WhatsApp-Style Profile Picture Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Backdrop click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => !uploading && setShowPreviewModal(false)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-5 overflow-hidden"
            >
              {/* Header Bar */}
              <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white outfit">Profile Photo</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  disabled={uploading}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large WhatsApp-style Picture Preview */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-full h-full object-cover rounded-full"
                    alt="Profile full preview"
                  />
                ) : (
                  <User className="w-24 h-24 text-purple-400/60" />
                )}

                {/* Upload Overlay Spinner */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-xs font-semibold text-white">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Change / Edit Photo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  disabled={uploading}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors border border-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}