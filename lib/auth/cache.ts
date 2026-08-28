import { supabase } from "@/lib/supabase/client";

// In-memory cache
let userCachePromise: Promise<any> | null = null;
let profileCachePromise: Promise<any> | null = null;
let lastUserFetch = 0;
let lastProfileFetch = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedUser = async () => {
  const now = Date.now();
  if (userCachePromise && now - lastUserFetch < CACHE_TTL) {
    return userCachePromise;
  }

  userCachePromise = Promise.resolve(supabase.auth.getUser()).then((res) => {
    if (res.error) userCachePromise = null;
    return res;
  });
  lastUserFetch = now;
  return userCachePromise;
};

export const getCachedProfile = async (userId: string) => {
  const now = Date.now();
  if (profileCachePromise && now - lastProfileFetch < CACHE_TTL) {
    return profileCachePromise;
  }

  profileCachePromise = Promise.resolve(
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .maybeSingle()
  ).then((res) => {
    if (res.error) profileCachePromise = null;
    return res;
  });
  lastProfileFetch = now;
  return profileCachePromise;
};

export const clearAuthCache = () => {
  userCachePromise = null;
  profileCachePromise = null;
  lastUserFetch = 0;
  lastProfileFetch = 0;
};
