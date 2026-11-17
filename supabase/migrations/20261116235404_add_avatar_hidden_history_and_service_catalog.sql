/*
# CampChores: avatar, histórico ocultável e catálogo de serviços

1. Propósito
- Suportar as novas funcionalidades do app: foto de perfil, histórico de contratações ocultável por usuário e catálogo público de serviços.

2. Novas tabelas
- `public.service_catalog`: vitrine pública de serviços publicados, com um snapshot simples (título, descrição, categoria, telefone) para navegação de visitantes.

3. Colunas adicionadas
- `public.profiles.avatar_url`: caminho do objeto no bucket privado `avatars` (relativo ao bucket, sem URL assinada).
- `public.contracts.hidden_at`: timestamp que marca quando o cliente escondeu o contrato do próprio histórico. NULL significa visível.

4. Segurança (RLS e grants)
- `service_catalog`: leitura pública para anon e authenticated (dados de vitrine); escrita apenas para o dono via políticas owner-scoped.
- `profiles.avatar_url`: atualizável apenas pelo dono (grant de coluna); leitura do perfil continua restrita ao dono.
- `contracts.hidden_at`: atualizável apenas pelo dono (cliente), via grant de coluna; leitura continua participant-only.
- `storage.objects`: políticas owner-scoped no bucket `avatars` (pasta por user id), escrita somente autenticada.
- Bucket `avatars` criado como privado; leitura via URLs assinadas de curta duração.

5. Notas importantes
- Nenhum dado é destruído: apenas colunas/tabelas adicionadas e grants concedidos.
- Esconder contrato não apaga dados: apenas preenche `hidden_at`; a UI filtra por `hidden_at IS NULL`.
*/

-- Catálogo público de serviços (vitrine)
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  category text NOT NULL CHECK (category IN ('Limpeza Geral', 'Passadoria', 'Jardinagem', 'Pequenos Reparos', 'Organização')),
  contact_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_catalog_owner_idx ON public.service_catalog(owner_id);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.service_catalog TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.service_catalog FROM anon, authenticated;
GRANT INSERT (title, description, category, contact_phone) ON public.service_catalog TO authenticated;
GRANT UPDATE (title, description, category, contact_phone) ON public.service_catalog TO authenticated;
GRANT DELETE ON public.service_catalog TO authenticated;

DROP POLICY IF EXISTS "service_catalog_select_public" ON public.service_catalog;
CREATE POLICY "service_catalog_select_public" ON public.service_catalog FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service_catalog_insert_own" ON public.service_catalog;
CREATE POLICY "service_catalog_insert_own" ON public.service_catalog FOR INSERT
TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "service_catalog_update_own" ON public.service_catalog;
CREATE POLICY "service_catalog_update_own" ON public.service_catalog FOR UPDATE
TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "service_catalog_delete_own" ON public.service_catalog;
CREATE POLICY "service_catalog_delete_own" ON public.service_catalog FOR DELETE
TO authenticated USING (owner_id = auth.uid());

-- Foto de perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, phone, location, bio, avatar_url) ON public.profiles TO authenticated;

-- Histórico oculto (soft-hide, sem deleção de dados)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

REVOKE UPDATE ON public.contracts FROM authenticated;
GRANT UPDATE (hidden_at) ON public.contracts TO authenticated;

-- Bucket privado de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_insert_own_folder" ON storage.objects;
CREATE POLICY "avatars_insert_own_folder" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
CREATE POLICY "avatars_select_own" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
