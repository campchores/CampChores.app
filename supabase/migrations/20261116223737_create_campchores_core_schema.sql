/*
# Create CampChores core database

1. Purpose
- Creates the durable Supabase data model for CampChores while keeping the existing demo data independent.
- Supports real Supabase email/password accounts, public service discovery, protected contracting workflows, ratings, and safety reports.

2. New tables and columns
- `public.profiles`
  - `id`: the Supabase Auth user id and primary key.
  - `public_id`: generated CampChores key in the `CC-XXXXXX` format.
  - `display_name`, `email`, `phone`, `location`: account profile details.
  - `is_provider`: server-controlled collaborator status.
  - `created_at`, `updated_at`: audit timestamps.
- `public.services`
  - `id`: service identifier.
  - `provider_id`: collaborator profile that owns the listing.
  - `category`, `title`, `description`, `details`, `location`, `contact_phone`: public listing information.
  - `rating`, `reviews_count`: server-maintained aggregate values.
  - `is_active`, `created_at`, `updated_at`: publication and audit fields.
- `public.contracts`
  - `id`: contract identifier.
  - `client_id`, `provider_id`, `service_id`: participants and source service.
  - `service_title`, `provider_name`, `category`, `contact_phone`: immutable snapshots for historical records.
  - `status`, `confirmation_code`, `created_at`, `completed_at`: safety and lifecycle data.
- `public.reviews`
  - `id`, `contract_id`, `service_id`, `provider_id`, `client_id`: review relationships.
  - `rating`, `comment`, `created_at`: review content.
- `public.reports`
  - `id`, `reporter_id`, `category`, `description`, `status`, `created_at`: safety reports.

3. Server behavior
- A trigger creates a profile automatically after a Supabase Auth account is created.
- Public keys are generated on the server and never accepted from the client.
- Contracts, confirmation codes, completion, collaborator activation, and reviews are written through protected database functions.
- Service ratings and review counts are recalculated by a database trigger.

4. Security changes
- Row Level Security is enabled on every new table.
- Profiles and personal reports are owner-scoped to authenticated users.
- Active services are readable publicly; service writes are limited to the owning verified collaborator.
- Contracts are readable only by the client or provider involved.
- Sensitive and server-controlled columns are excluded from client write privileges.
- Public review reads expose only review content columns, not the reviewing user's identity column.
- Security-definer functions use a fixed `search_path` and have restricted EXECUTE grants.

5. Important notes
- No CPF or password is stored in the public schema; passwords remain managed by Supabase Auth.
- This migration does not seed fake users or services. The existing `src/data/mockData.ts` remains the isolated demonstration dataset.
- The frontend must use Supabase Auth and the protected functions when moving from demo storage to production persistence.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_id text UNIQUE NOT NULL CHECK (public_id ~ '^CC-[0-9]{6}$'),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) >= 2),
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Campinas, SP',
  is_provider boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('Limpeza Geral', 'Passadoria', 'Jardinagem', 'Pequenos Reparos', 'Organização')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 500),
  details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 3 AND 1000),
  location text NOT NULL DEFAULT 'Campinas, SP',
  contact_phone text NOT NULL CHECK (char_length(btrim(contact_phone)) BETWEEN 8 AND 30),
  rating numeric(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_title text NOT NULL,
  provider_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Limpeza Geral', 'Passadoria', 'Jardinagem', 'Pequenos Reparos', 'Organização')),
  contact_phone text NOT NULL,
  status text NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
  confirmation_code text NOT NULL CHECK (confirmation_code ~ '^[0-9]{4}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid UNIQUE NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('safety', 'service', 'conduct', 'other')),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_provider_id_idx ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS services_active_category_idx ON public.services(is_active, category);
CREATE INDEX IF NOT EXISTS contracts_client_id_idx ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS contracts_provider_id_idx ON public.contracts(provider_id);
CREATE INDEX IF NOT EXISTS reviews_service_id_idx ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);

CREATE OR REPLACE FUNCTION public.make_campchores_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := 'CC-' || (floor(random() * 900000) + 100000)::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE public_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, public_id, display_name, email)
  VALUES (
    NEW.id,
    public.make_campchores_public_id(),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''), split_part(COALESCE(NEW.email, 'CampChores User'), '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_campchores ON auth.users;
CREATE TRIGGER on_auth_user_created_campchores
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_service_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.services
    SET rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE service_id = OLD.service_id), 5.0),
        reviews_count = (SELECT count(*) FROM public.reviews WHERE service_id = OLD.service_id)
    WHERE id = OLD.service_id;
    RETURN OLD;
  END IF;

  UPDATE public.services
  SET rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE service_id = NEW.service_id), 5.0),
      reviews_count = (SELECT count(*) FROM public.reviews WHERE service_id = NEW.service_id)
  WHERE id = NEW.service_id;

  IF TG_OP = 'UPDATE' AND OLD.service_id <> NEW.service_id THEN
    UPDATE public.services
    SET rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE service_id = OLD.service_id), 5.0),
        reviews_count = (SELECT count(*) FROM public.reviews WHERE service_id = OLD.service_id)
    WHERE id = OLD.service_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_refresh_service_rating ON public.reviews;
CREATE TRIGGER reviews_refresh_service_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_service_rating();

CREATE OR REPLACE FUNCTION public.become_provider()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.profiles SET is_provider = true WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.create_contract(p_service_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
  v_provider_id uuid;
  v_service_title text;
  v_provider_name text;
  v_category text;
  v_contact_phone text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT s.provider_id, s.title, p.display_name, s.category, s.contact_phone
  INTO v_provider_id, v_service_title, v_provider_name, v_category, v_contact_phone
  FROM public.services s
  JOIN public.profiles p ON p.id = s.provider_id
  WHERE s.id = p_service_id AND s.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service unavailable';
  END IF;

  IF v_provider_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot contract your own service';
  END IF;

  INSERT INTO public.contracts (client_id, provider_id, service_id, service_title, provider_name, category, contact_phone, confirmation_code)
  VALUES (
    auth.uid(),
    v_provider_id,
    p_service_id,
    v_service_title,
    v_provider_name,
    v_category,
    v_contact_phone,
    (floor(random() * 9000) + 1000)::int::text
  )
  RETURNING id INTO v_contract_id;

  RETURN v_contract_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_contract_completion(p_contract_id uuid, p_confirmation_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_confirmation_code !~ '^[0-9]{4}$' THEN
    RETURN false;
  END IF;

  UPDATE public.contracts
  SET status = 'completed', completed_at = now()
  WHERE id = p_contract_id
    AND client_id = auth.uid()
    AND status = 'ongoing'
    AND confirmation_code = p_confirmation_code;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.rate_contract(p_contract_id uuid, p_rating integer, p_comment text DEFAULT '')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_id uuid;
  v_service_id uuid;
  v_provider_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_rating < 1 OR p_rating > 5 OR char_length(COALESCE(p_comment, '')) > 500 THEN
    RAISE EXCEPTION 'Invalid review';
  END IF;

  SELECT service_id, provider_id INTO v_service_id, v_provider_id
  FROM public.contracts
  WHERE id = p_contract_id AND client_id = auth.uid() AND status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract unavailable for review';
  END IF;

  INSERT INTO public.reviews (contract_id, service_id, provider_id, client_id, rating, comment)
  VALUES (p_contract_id, v_service_id, v_provider_id, auth.uid(), p_rating, COALESCE(p_comment, ''))
  ON CONFLICT (contract_id) DO UPDATE
  SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, phone, location) ON public.profiles TO authenticated;

REVOKE ALL ON public.services FROM anon;
GRANT SELECT ON public.services TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.services FROM authenticated;
GRANT INSERT (category, title, description, details, location, contact_phone, is_active) ON public.services TO authenticated;
GRANT UPDATE (category, title, description, details, location, contact_phone, is_active) ON public.services TO authenticated;
GRANT DELETE ON public.services TO authenticated;

REVOKE ALL ON public.contracts FROM anon, authenticated;
GRANT SELECT ON public.contracts TO authenticated;

REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT (service_id, provider_id, rating, comment, created_at) ON public.reviews TO anon, authenticated;

REVOKE ALL ON public.reports FROM anon, authenticated;
GRANT SELECT ON public.reports TO authenticated;
GRANT INSERT (category, description) ON public.reports TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "services_select_active_or_own" ON public.services;
CREATE POLICY "services_select_active_or_own" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true OR provider_id = auth.uid());
DROP POLICY IF EXISTS "services_insert_provider" ON public.services;
CREATE POLICY "services_insert_provider" ON public.services FOR INSERT TO authenticated WITH CHECK (provider_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_provider = true));
DROP POLICY IF EXISTS "services_update_provider" ON public.services;
CREATE POLICY "services_update_provider" ON public.services FOR UPDATE TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_provider = true));
DROP POLICY IF EXISTS "services_delete_provider" ON public.services;
CREATE POLICY "services_delete_provider" ON public.services FOR DELETE TO authenticated USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "contracts_select_participant" ON public.contracts;
CREATE POLICY "contracts_select_participant" ON public.contracts FOR SELECT TO authenticated USING (client_id = auth.uid() OR provider_id = auth.uid());

DROP POLICY IF EXISTS "reviews_select_public_columns" ON public.reviews;
CREATE POLICY "reviews_select_public_columns" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

REVOKE EXECUTE ON FUNCTION public.make_campchores_public_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_service_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.become_provider() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_provider() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_contract(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_contract(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_contract_completion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_contract_completion(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rate_contract(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_contract(uuid, integer, text) TO authenticated;
