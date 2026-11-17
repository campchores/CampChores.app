/*
# Add CampChores profile bio and service reports

1. Purpose
- Adds the editable public biography required by the Instagram-style profile.
- Links safety reports to the service that was reported.

2. Changes
- `public.profiles.bio`: short public description, defaulting to an empty string.
- `public.reports.service_id`: optional service reference for service-specific reports.
- Adds an index for looking up reports by service.

3. Security changes
- Authenticated profile owners may update `bio` alongside their existing personal fields.
- Authenticated users may include a service id when creating their own report.
- Existing RLS rules continue to restrict profile reads to the owner and reports to the reporter.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reports_service_id_idx ON public.reports(service_id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, phone, location, bio) ON public.profiles TO authenticated;

REVOKE INSERT ON public.reports FROM authenticated;
GRANT INSERT (category, description, service_id) ON public.reports TO authenticated;
