-- Run this SQL in your Supabase SQL Editor for new features
-- (Sections 1, 4, 5, 9 of latest batch)

-- 1. Writer Applications
CREATE TABLE IF NOT EXISTS public.writer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  bio TEXT NOT NULL,
  writing_samples TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending|approved|rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.writer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own application" ON public.writer_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own application" ON public.writer_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Followers
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  writer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, writer_id)
);
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users follow" ON public.followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.followers
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 3. Article Reactions
CREATE TABLE IF NOT EXISTS public.article_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- informative|shocking|happy|sad|angry
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (article_slug, user_id)
);
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reactions" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Users react" ON public.article_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reaction" ON public.article_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reaction" ON public.article_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- new_follower|comment|reply|tip|breaking|badge|app_status
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
