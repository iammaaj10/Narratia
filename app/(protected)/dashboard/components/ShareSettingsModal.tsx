"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { fetchCreatorProfile } from "@/lib/social/socialClient";
import { Globe, Lock, Copy, Check, X, UserCheck, ShieldAlert, Trash2, Plus, Users } from "lucide-react";

type Props = {
  projectId: string;
  project: any;
  onClose: () => void;
  onUpdate: () => void;
};

type Follower = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

type PrivateReader = {
  id: string;
  user_id?: string | null;
  invited_email?: string | null;
  role: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

export default function ShareSettingsModal({
  projectId,
  project,
  onClose,
  onUpdate,
}: Props) {
  const [isPublic, setIsPublic] = useState(project?.is_public || false);
  const [slug, setSlug] = useState(project?.slug || "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Private Reader Access State
  const [currentUserId, setCurrentUserId] = useState("");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [privateReaders, setPrivateReaders] = useState<PrivateReader[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [grantSuccess, setGrantSuccess] = useState("");

  useEffect(() => {
    loadAccessData();
  }, [projectId]);

  const loadAccessData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);

      // 1. Fetch followers & connections of the author
      const { data: followRecords } = await supabase
        .from("user_follows")
        .select("follower_id, following_id")
        .or(`following_id.eq.${user.id},follower_id.eq.${user.id}`);

      if (followRecords && followRecords.length > 0) {
        const relatedUserIds = Array.from(
          new Set(
            followRecords
              .flatMap((f) => [f.follower_id, f.following_id])
              .filter((id) => Boolean(id) && id !== user.id)
          )
        );

        const validUserIds = relatedUserIds.filter(
          (id) => typeof id === "string" && id.trim().length > 10
        );

        if (validUserIds.length > 0) {
          const { data: followerProfiles } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .in("id", validUserIds);

          setFollowers((followerProfiles as Follower[]) || []);
        }
      }

      // 2. Fetch existing private readers for this project
      const { data: readerMembers } = await supabase
        .from("project_members")
        .select("id, user_id, invited_email, role")
        .eq("project_id", projectId)
        .in("role", ["reader", "viewer"]);

      if (readerMembers && readerMembers.length > 0) {
        const validReaderIds = readerMembers
          .map((rm) => rm.user_id)
          .filter((id) => Boolean(id) && typeof id === "string" && id.trim().length > 10) as string[];

        let profMap = new Map();
        if (validReaderIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", validReaderIds);
          if (profs) {
            profMap = new Map(profs.map((p) => [p.id, p]));
          }
        }

        const readersWithProfiles: PrivateReader[] = readerMembers.map((rm) => ({
          id: rm.id,
          user_id: rm.user_id || "",
          invited_email: rm.invited_email,
          role: rm.role,
          profiles: {
            username: (rm.user_id && profMap.get(rm.user_id)?.username) || rm.invited_email || "reader",
            avatar_url: (rm.user_id && profMap.get(rm.user_id)?.avatar_url) || null,
          },
        }));
        setPrivateReaders(readersWithProfiles);
      } else {
        setPrivateReaders([]);
      }
    } catch (err) {
      console.error("Error loading follower access data:", err);
    }
  };

  const grantPrivateReaderAccess = async (targetEmailInput?: string) => {
    const rawInput = (targetEmailInput || usernameInput).trim().toLowerCase().replace(/^@/, "");
    if (!rawInput) return;

    setGrantError("");
    setGrantSuccess("");
    setGrantingAccess(true);

    try {
      // Check if already granted access
      const existing = privateReaders.find(
        (r) =>
          r.invited_email?.toLowerCase() === rawInput ||
          r.profiles?.username?.toLowerCase() === rawInput
      );
      if (existing) {
        setGrantError(`"${rawInput}" already has private reader access.`);
        setGrantingAccess(false);
        return;
      }

      // Check if user is registered to attach user_id if available
      // Only include id.eq filter if input looks like a UUID (not an email)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawInput);
      const isEmail = rawInput.includes("@");
      const orFilters = [`username.ilike."${rawInput}"`];
      if (isEmail) orFilters.push(`email.ilike."${rawInput}"`);
      if (isUUID) orFilters.push(`id.eq."${rawInput}"`);

      const { data: profileMatch } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .or(orFilters.join(","))
        .maybeSingle();

      let insertedRow: any = null;

      // Insert with invited_by (required by RLS policy) and role: 'viewer' (allowed by check constraint)
      const { data: inserted, error: insertErr } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: profileMatch?.id || null,
          invited_email: rawInput,
          invited_by: currentUserId,
          role: "viewer",
          status: "accepted",
        })
        .select("id, user_id, role, invited_email")
        .maybeSingle();

      if (!inserted || insertErr) {
        // Fallback: without user_id but still with invited_by
        const { data: fallbackInserted, error: fallbackErr } = await supabase
          .from("project_members")
          .insert({
            project_id: projectId,
            invited_email: rawInput,
            invited_by: currentUserId,
            role: "viewer",
            status: "accepted",
          })
          .select("id, role, invited_email")
          .single();

        if (fallbackErr) {
          if (fallbackErr.code === "23505") {
            setGrantError(`"${rawInput}" already has private reader access.`);
          } else {
            setGrantError(`Failed to grant access: ${fallbackErr.message}`);
          }
          setGrantingAccess(false);
          return;
        }
        insertedRow = fallbackInserted;
      } else {
        insertedRow = inserted;
      }

      // Ensure is_team is set on project
      await supabase.from("projects").update({ is_team: true }).eq("id", projectId);

      // Send notification if profile found
      if (profileMatch?.id) {
        await supabase.from("notifications").insert({
          user_id: profileMatch.id,
          type: "invite",
          title: "Private Story Access Granted 📖",
          message: `You were granted private reading access to '${project.title}'!`,
          link: `/story/${project.slug || projectId}`,
          project_id: projectId,
          read: false,
        });
      }

      const newReader: PrivateReader = {
        id: insertedRow.id,
        user_id: insertedRow.user_id || profileMatch?.id || "",
        invited_email: rawInput,
        role: insertedRow.role,
        profiles: {
          username: profileMatch?.username || rawInput,
          avatar_url: profileMatch?.avatar_url || null,
        },
      };

      setPrivateReaders((prev) => [...prev, newReader]);
      setUsernameInput("");
      setGrantSuccess(`🎉 Granted private reading access to ${rawInput}!`);
    } catch (err: any) {
      console.error("Error granting private reader access:", err);
      setGrantError(err.message || "Failed to grant reader access.");
    } finally {
      setGrantingAccess(false);
    }
  };

  const revokeAccess = async (memberId: string, username: string) => {
    try {
      await supabase.from("project_members").delete().eq("id", memberId);
      setPrivateReaders((prev) => prev.filter((r) => r.id !== memberId));
      setGrantSuccess(`Revoked private access for @${username}`);
    } catch (err) {
      console.error("Error revoking access:", err);
    }
  };

  const generateSlug = async () => {
    const { data, error } = await supabase.rpc("generate_slug", {
      title: project.title,
    });

    if (!error && data) {
      setSlug(data);
    }
  };

  const saveSettings = async () => {
    setLoading(true);

    let finalSlug = slug;
    if (isPublic && !slug) {
      const { data } = await supabase.rpc("generate_slug", {
        title: project.title,
      });
      finalSlug = data || "";
    }

    const { error } = await supabase
      .from("projects")
      .update({
        is_public: isPublic,
        slug: isPublic ? finalSlug : null,
      })
      .eq("id", projectId);

    if (error) {
      console.error("❌ Error updating share settings:", error);
      alert(`Failed to update settings in database: ${error.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    onUpdate();
    onClose();
    alert(isPublic ? "Story is now public!" : "Story is now private");
  };

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/story/${slug || projectId}`
      : "";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl border border-white/10 p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white outfit">Story Access & Privacy</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Public Toggle */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Lock className="w-5 h-5 text-purple-400" />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {isPublic ? "Public Manuscript" : "Private Manuscript"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isPublic
                      ? "Anyone on Narratia or with the link can read"
                      : "Only you & permitted followers can read"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isPublic ? "bg-emerald-500" : "bg-purple-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── PRIVATE READER ACCESS SECTION ── */}
          {!isPublic && (
            <div className="p-4 bg-purple-500/[0.06] rounded-2xl border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm outfit">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Grant Private Reading Access</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Allow specific users to read your private story. Enter their <strong>Email ID</strong> or <strong>Username</strong>.
              </p>

              {/* Email / Username Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter Email ID or Username (e.g. john@example.com)"
                    className="flex-1 bg-black/40 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 text-xs font-mono"
                  />
                  <button
                    onClick={() => grantPrivateReaderAccess()}
                    disabled={grantingAccess || !usernameInput.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{grantingAccess ? "Adding..." : "Grant"}</span>
                  </button>
                </div>

                {/* Quick Select from Followers List */}
                {followers.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Quick select from your followers:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {followers.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setUsernameInput(f.username);
                            grantPrivateReaderAccess(f.username);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-[11px] text-gray-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>@{f.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Alert Messages */}
              {grantError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{grantError}</span>
                </div>
              )}

              {grantSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {grantSuccess}
                </div>
              )}

              {/* List of Allowed Private Readers & Revoke Access Option */}
              <div className="pt-2 space-y-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                  <span>Allowed Private Readers ({privateReaders.length})</span>
                </div>
                {privateReaders.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-1">
                    No private readers granted yet. Enter an Email ID or select a follower above to give them read-only access.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {privateReaders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {r.profiles?.avatar_url ? (
                            <img
                              src={r.profiles.avatar_url}
                              className="w-6 h-6 rounded-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                              {(r.profiles?.username || "R").substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-white">
                            @{r.profiles?.username || "reader"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                            Reader Access
                          </span>
                        </div>
                        <button
                          onClick={() => revokeAccess(r.id, r.profiles?.username || "reader")}
                          title="Revoke Private Access"
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slug Input */}
          {isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Story URL Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="my-awesome-story"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                />
                <button
                  onClick={generateSlug}
                  className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all whitespace-nowrap text-xs font-semibold cursor-pointer"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {typeof window !== "undefined" &&
                  `${window.location.origin}/story/${slug || "your-slug"}`}
              </p>
            </div>
          )}

          {/* Public URL (if public) */}
          {isPublic && project.is_public && project.slug && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <p className="text-sm text-emerald-300 mb-2 font-medium">
                Your story is live & public!
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 bg-black/20 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-200"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading || (isPublic && !slug)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 text-xs cursor-pointer"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}