# How to set your email as admin via `/setup-admin`

The setup-admin page is already built and wired into the app. It lives at the route **`/setup-admin`** and is rendered by `src/pages/SetupAdminPage.tsx` (registered in `src/App.tsx`).

## Step-by-step

1. **Make sure you're signed in.**
   - Open your live site: `https://news-hub-89.lovable.app/auth`
   - Sign in (or sign up) with the email you want to be admin (e.g. your Gmail). If you sign up new, confirm the email if confirmation is enabled.

2. **Open the setup page.**
   - In the browser address bar, go to:
     `https://news-hub-89.lovable.app/setup-admin`
   - (Or in the preview: `/setup-admin`.)

3. **The page auto-checks state.** You'll see one of:
   - **"No admin found yet"** with a **"Make me admin"** button — click it. It inserts a row into `public.user_roles` with your `user_id` and role `admin`, then redirects to `/admin`.
   - **"You are already an admin"** — nothing to do; click "Go to Admin".
   - **"An admin already exists"** — for safety, the page refuses to self-grant when an admin is already set. In that case, use the SQL fallback below.

4. **Verify.** In Supabase SQL Editor:
   ```sql
   SELECT u.email, ur.role
   FROM auth.users u
   JOIN public.user_roles ur ON ur.user_id = u.id
   WHERE ur.role = 'admin';
   ```
   Your email should appear.

## If the page says "admin already exists" (SQL fallback)

Run this in the Supabase SQL Editor — replace the email:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Then reload the site; the Navbar should now show **Admin** options.

## Why you might not see `/setup-admin`

- It's a direct URL — there is no navbar link by design (it's a setup tool).
- It is wrapped in `ProtectedRoute`, so unauthenticated visits bounce to `/auth` first.
- If you typed it and got the 404 page, hard-refresh (Ctrl/Cmd+Shift+R) — the route was added in the last build and a stale cached HTML can miss it.

## Optional follow-up (only if you want)

I can add a small **"Setup admin"** link in the Footer (or a one-time toast on the homepage when no admin exists) so the page is easier to discover. Say the word and I'll switch to build mode to add it.
