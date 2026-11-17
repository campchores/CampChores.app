/*
# Tighten CampChores profile privileges

1. Purpose
- Removes inherited write permissions from the authenticated role on `public.profiles`.
- Keeps profile changes limited to the explicitly allowed personal fields.

2. Security changes
- Authenticated users can read only their own profile through the existing RLS policy.
- Authenticated users can update only `display_name`, `phone`, and `location` on their own profile.
- Direct profile inserts and deletes are revoked; the Auth trigger is the only profile creation path.
- Collaborator activation remains available only through the protected `become_provider()` function.
*/

REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, phone, location) ON public.profiles TO authenticated;
