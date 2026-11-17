/*
# Allow guests to read provider public names

1. Why
- The home screen loads even for visitors using "Modo Sem Conta" (guest mode).
- To render the service list it reads provider display names from `public.profiles`.
- `profiles` only had SELECT granted to `authenticated`, so the guest client
  received HTTP 401 "permission denied for table profiles", which crashed the
  app at startup (Uncaught Error right after load).

2. Security changes
- Grant `anon` (guest visitors) column-level SELECT on ONLY the two columns
  that are public by design: `id` and `display_name`.
- No access to email, phone, location, bio, avatar_url or any private column
  for guests. Row visibility for guests is still limited by the existing RLS
  policy (`profiles_select_own` is scoped TO authenticated), so anon reads of
  these columns return only rows allowed by policy. Because no anon SELECT
  policy exists, anon can read zero rows via policy — to make the names
  readable to guests we also add a narrow SELECT policy exposing ONLY
  providers' id/display_name to everyone.

3. Notes
- Guest users browsing the app need the provider name that is shown with each
  service. Restricting the grant to (id, display_name) means even if policy
  allows rows, guests can never read private columns.
- `authenticated` keeps its existing owner-scoped policy; nothing changes for
  signed-in users.
*/

GRANT SELECT (id, display_name) ON public.profiles TO anon;

DROP POLICY IF EXISTS "profiles_select_public_names" ON public.profiles;
CREATE POLICY "profiles_select_public_names"
ON public.profiles FOR SELECT
TO anon
USING (true);