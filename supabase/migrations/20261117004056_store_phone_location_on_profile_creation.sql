/*
# Store phone and location from signup metadata

1. Purpose
- New accounts were created with empty phone and default location because the profile-creation trigger ignored the signup metadata.
- Empty phone later blocked publishing services (database requires a valid contact phone).

2. Changes
- `handle_new_auth_user()` now reads `phone` and `location` from the user metadata written by the app at signup.
- Existing profiles are not modified; users can still edit their profile in the app.

3. Security
- No policy or grant changes. The function keeps SECURITY DEFINER with a fixed search_path and EXECUTE restricted (trigger-only).
*/

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, public_id, display_name, email, phone, location)
  VALUES (
    NEW.id,
    public.make_campchores_public_id(),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''), split_part(COALESCE(NEW.email, 'CampChores User'), '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'location'), ''), 'Campinas, SP')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
