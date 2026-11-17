/*
# Expose provider name and avatar to signed-in users

1. Purpose
- Fix the home screen showing the fallback name "Colaborador CampChores" and
  the "CC" initials avatar for signed-in users, even when the provider has a
  real name and photo.

2. Root cause
- `profiles` SELECT was owner-scoped for `authenticated` (only own row), so a
  signed-in user browsing the home screen could not read other providers'
  display names. The public names policy existed only for `anon` (guests).
- `avatar_url` was not granted to any client-facing role and the avatars
  bucket was only readable by the file owner, so no provider photo could be
  displayed to other users.

3. Security changes (grants remain column-restricted)
- `anon`: grant SELECT on (id, display_name, avatar_url) — was (id, display_name).
- `authenticated`: grant SELECT on (id, display_name, avatar_url) in addition
  to the existing full-row owner read. Signed-in users can read ONLY these
  public columns of other users; email, phone, location, bio remain private
  because they are not in the grant.
- RLS policy `profiles_select_public_names` widened from `TO anon` to
  `TO anon, authenticated` with `USING (true)`: every signed-in user can now
  see other users' rows, but the column grants above limit what is readable
  to id, display_name and avatar_url.
- Storage: new policy allows SELECT on avatars objects so any client can
  create signed URLs for provider photos (short-lived, private bucket).
  Existing owner-only policies for upload/update/delete are unchanged.

4. Important notes
- Signed URL creation by other users requires SELECT on storage.objects for
  the requesting role; hence the new avatars_select_public policy.
- Owner full-row read (`profiles_select_own`) is untouched.
- No write grants are added or widened.
*/

GRANT SELECT (id, display_name, avatar_url) ON public.profiles TO anon;
GRANT SELECT (id, display_name, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_public_names" ON public.profiles;
CREATE POLICY "profiles_select_public_names"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');