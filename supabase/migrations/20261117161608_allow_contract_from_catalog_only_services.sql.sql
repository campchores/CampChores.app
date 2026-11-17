/*
# Make create_contract accept catalog-only service listings

1. Purpose
- Fix "Service unavailable" (P0001) when a signed-in user registers a contract
  from a card that exists only in the simple showcase (`service_catalog`)
  and has no active row in `public.services`. The `contracts.service_id`
  column requires a real services row, so the contract could never be created.

2. Modified function
- `public.create_contract(p_service_id uuid)`: when the id is not found among
  active structured services, the function now looks it up in
  `service_catalog`. If found, it materializes the equivalent structured
  service (source of truth for full listings) owned by the same provider and
  creates the contract against it. Description/details fall back to safe
  defaults when the catalog text is too short for the column checks.

3. Security changes
- None. The function remains SECURITY DEFINER with a fixed search_path,
  callable only by `authenticated`, and keeps rejecting self-contracting.

4. Important notes
- No schema change; no new grants. Contract history, confirmation codes and
  ratings keep working unchanged.
*/

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
  v_catalog_description text;
  v_service_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT s.id, s.provider_id, s.title, p.display_name, s.category, s.contact_phone
  INTO v_service_id, v_provider_id, v_service_title, v_provider_name, v_category, v_contact_phone
  FROM public.services s
  JOIN public.profiles p ON p.id = s.provider_id
  WHERE s.id = p_service_id AND s.is_active = true;

  IF NOT FOUND THEN
    SELECT c.owner_id, c.title, p.display_name, c.category, c.contact_phone, c.description
    INTO v_provider_id, v_service_title, v_provider_name, v_category, v_contact_phone, v_catalog_description
    FROM public.service_catalog c
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE c.id = p_service_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Service unavailable';
    END IF;

    INSERT INTO public.services (provider_id, category, title, description, details, location, contact_phone)
    VALUES (
      v_provider_id,
      v_category,
      v_service_title,
      CASE
        WHEN char_length(btrim(COALESCE(v_catalog_description, ''))) BETWEEN 10 AND 500 THEN v_catalog_description
        ELSE 'Serviço anunciado na vitrine da comunidade CampChores.'
      END,
      'Detalhes combinados diretamente com o prestador.',
      'Campinas, SP',
      v_contact_phone
    )
    RETURNING id INTO v_service_id;
  END IF;

  IF v_provider_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot contract your own service';
  END IF;

  INSERT INTO public.contracts (client_id, provider_id, service_id, service_title, provider_name, category, contact_phone, confirmation_code)
  VALUES (
    auth.uid(),
    v_provider_id,
    v_service_id,
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