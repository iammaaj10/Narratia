-- ─────────────────────────────────────────────────────────────────
-- NARRATIA SOCIAL & CREATOR HUB DATABASE SCHEMA MIGRATION
-- ─────────────────────────────────────────────────────────────────

-- 1. Extend Profiles Table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url text DEFAULT null,
  ADD COLUMN IF NOT EXISTS open_for_collaboration boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS twitter_handle text DEFAULT null,
  ADD COLUMN IF NOT EXISTS discord_handle text DEFAULT null,
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT null;

-- 2. Extend Projects Table
ALTER TABLE IF EXISTS public.projects
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text DEFAULT null,
  ADD COLUMN IF NOT EXISTS genre text DEFAULT 'Fiction',
  ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_for_collaboration boolean DEFAULT true;

-- 3. User Follows Table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 4. Story Likes Table
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- 5. Collaboration Requests Table
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_role text NOT NULL DEFAULT 'Co-Writer', -- 'Co-Writer', 'Line Editor', 'Beta Reader'
  pitch_message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamptz DEFAULT now()
);

-- 6. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz DEFAULT null,
  created_at timestamptz DEFAULT now()
);

-- RLS Security Policies
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- User Follows RLS Policies
CREATE POLICY "Public read user_follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Authenticated insert user_follows" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Authenticated delete user_follows" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Story Likes RLS Policies
CREATE POLICY "Public read story_likes" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated insert story_likes" ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated delete story_likes" ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- Collaboration Requests RLS Policies
CREATE POLICY "Users can view relevant collab requests" ON public.collaboration_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create collab requests" ON public.collaboration_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipient can update collab request status" ON public.collaboration_requests
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Direct Messages RLS Policies
CREATE POLICY "Users can view direct messages sent/received by them" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send direct messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Projects RLS Policies
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
  FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Owners can update their projects" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

-- Profiles RLS Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
