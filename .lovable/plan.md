## Build Plan: Remaining Features

I'll build the four remaining features in order of dependency. Here's the scope:

### 1. Reading Lists (Save for Later)
- New table `reading_list` (user_id, article_id, saved_at) with RLS
- "Save" bookmark button on article cards + article detail page
- New page `/reading-list` showing saved articles
- Nav link in header (logged-in users only)

### 2. Points & Badges System
- New table `badges` (id, name, description, icon, criteria)
- New table `user_badges` (user_id, badge_id, earned_at)
- Award points automatically via DB triggers:
  - +10 for publishing an article (writers)
  - +2 for receiving a reaction
  - +5 for getting a follower
  - +1 for reading an article
- Badge tiers (Bronze 50pts, Silver 200pts, Gold 500pts, Platinum 1000pts)
- Display points + badges on profile page
- Leaderboard section on home or `/leaderboard`

### 3. Editor Dashboard `/editor`
- Protected route (writer/admin only)
- Tabs: My Articles | Drafts | Analytics | New Article
- Stats: total articles, total views, total reactions, followers, points
- Article list with edit/delete/publish actions
- Quick link to AI article generator

### 4. Admin User Management Upgrades
- Enhance existing admin panel with:
  - Search/filter users by name, email, role
  - Bulk role changes (promote/demote)
  - Suspend/unsuspend users (uses existing `suspended` column)
  - Toggle premium status (uses existing `is_premium` column)
  - View user stats (articles count, points, join date)
  - Activity log table for admin actions

### Technical Details
- All new tables get GRANTs + RLS policies using `has_role()`
- Triggers use SECURITY DEFINER to update `profiles.total_points`
- Reading list uses optimistic UI with React Query invalidation
- Badge checks run on point updates via trigger
- Editor dashboard reuses existing article components
- Admin actions logged to new `admin_actions` audit table

### Files to Create
- `src/pages/ReadingList.tsx`
- `src/pages/EditorDashboard.tsx`
- `src/pages/Leaderboard.tsx`
- `src/components/SaveArticleButton.tsx`
- `src/components/BadgeDisplay.tsx`
- `src/components/PointsDisplay.tsx`
- `src/components/admin/UserManagementEnhanced.tsx`
- `src/hooks/useReadingList.ts`
- `src/hooks/useBadges.ts`
- 1 migration with all tables, GRANTs, RLS, triggers, seed badges

### Files to Update
- `src/App.tsx` — add new routes
- Header/nav — add Reading List + Editor links
- Article card + detail — add save button
- Profile page — show points + badges
- Existing admin user table — replace with enhanced version

Should I proceed with all four, or build them one at a time so you can review each?