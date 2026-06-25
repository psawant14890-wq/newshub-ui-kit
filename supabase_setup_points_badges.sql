-- ============================================================
-- POINTS, BADGES & ADMIN AUDIT — run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. BADGES catalogue
CREATE TABLE IF NOT EXISTS public.badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL,
  tier        text NOT NULL CHECK (tier IN ('bronze','silver','gold','platinum')),
  points_required integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL    ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges are public" ON public.badges;
CREATE POLICY "Badges are public" ON public.badges FOR SELECT USING (true);

-- 2. USER_BADGES (earned)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT INSERT, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User badges visible to all"  ON public.user_badges;
DROP POLICY IF EXISTS "User can manage own badges"  ON public.user_badges;
CREATE POLICY "User badges visible to all"  ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "User can manage own badges"  ON public.user_badges FOR ALL  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. ADMIN AUDIT log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     text NOT NULL,
  target_user uuid,
  details    jsonb,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit"  ON public.admin_actions;
DROP POLICY IF EXISTS "Admins write audit" ON public.admin_actions;
CREATE POLICY "Admins read audit"  ON public.admin_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins write audit" ON public.admin_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. POINTS helper: award points to a user
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_total integer;
BEGIN
  UPDATE public.profiles SET total_points = COALESCE(total_points, 0) + _points
   WHERE id = _user_id
   RETURNING total_points INTO new_total;

  -- Auto-grant tier badges
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT _user_id, b.id FROM public.badges b
   WHERE b.points_required > 0 AND new_total >= b.points_required
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END $$;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer) TO authenticated;

-- 5. AUTO-AWARD points on article publish (+10)
CREATE OR REPLACE FUNCTION public.points_on_article_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
     AND NEW.author_id IS NOT NULL
  THEN
    PERFORM public.award_points(NEW.author_id, 10);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_points_on_article_publish ON public.articles;
CREATE TRIGGER trg_points_on_article_publish
AFTER INSERT OR UPDATE OF status ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.points_on_article_publish();

-- 6. SEED default badges
INSERT INTO public.badges (slug, name, description, icon, tier, points_required) VALUES
  ('first-steps',  'First Steps',  'Earn your first 10 points',     'Sparkles', 'bronze',   10),
  ('bronze',       'Bronze Reader','Earn 50 points',                'Award',    'bronze',   50),
  ('silver',       'Silver Writer','Earn 200 points',               'Award',    'silver',  200),
  ('gold',         'Gold Contributor','Earn 500 points',            'Trophy',   'gold',    500),
  ('platinum',     'Platinum Legend','Earn 1000 points',            'Crown',    'platinum',1000)
ON CONFLICT (slug) DO NOTHING;

-- 7. LEADERBOARD view
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT p.id, p.name, p.avatar_url, COALESCE(p.total_points,0) AS total_points,
         (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = p.id) AS badge_count
    FROM public.profiles p
   WHERE COALESCE(p.suspended, false) = false
   ORDER BY p.total_points DESC NULLS LAST
   LIMIT 100;
GRANT SELECT ON public.leaderboard TO anon, authenticated;
