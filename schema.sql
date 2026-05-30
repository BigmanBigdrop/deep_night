-- ============================================================
-- DEEP NIGHT — Système de Billetterie VIP Privé
-- Soirée du 06 Juin 2026
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABLE : invitations
-- Lien unique envoyé par l'admin à chaque invité.
-- Contient le token qui va dans l'URL /register/[token].
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token       uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  guest_name  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  is_used     boolean NOT NULL DEFAULT false,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_token   ON public.invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_is_used ON public.invitations (is_used);

-- ============================================================
-- 3. TABLE : tickets
-- Ticket définitif créé lors de l'inscription.
-- Lié à un compte Supabase Auth (user_id) pour l'espace invité.
--
-- Boissons disponibles (sélection multiple par catégorie) :
--   Bieres      : 'Desperados' | 'Codys Bleue' | 'Heineken' | 'Beaufort'
--   Canettes    : 'Vody Noire' | 'Vody Tropicale' | 'Vody Mint'
--   Spirits     : 'Vodka Absolute' | 'Whytehall Honey' | 'Whytehall Chocolate'
--   Shots       : booléen
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id         uuid UNIQUE NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  qr_code_slug          uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),

  -- Compte Supabase Auth de l'invité (créé lors de l'inscription)
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identité
  guest_first_name      text NOT NULL,
  guest_last_name       text NOT NULL,
  guest_email           text,
  guest_phone           text,
  guest_photo_url       text,          -- URL Supabase Storage (optionnel)

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz,

  -- Préférences boissons
  has_completed_survey  boolean NOT NULL DEFAULT false,
  drink_beers           text[] NOT NULL DEFAULT '{}',
  -- Valeurs : 'Desperados', 'Codys Bleue', 'Heineken', 'Beaufort'
  drink_cans            text[] NOT NULL DEFAULT '{}',
  -- Valeurs : 'Vody Noire', 'Vody Tropicale', 'Vody Mint'
  drink_spirits         text[] NOT NULL DEFAULT '{}',
  -- Valeurs : 'Vodka Absolute', 'Whytehall Honey', 'Whytehall Chocolate'
  drink_wants_shots     boolean NOT NULL DEFAULT false,

  -- Scan à la porte
  checked_in            boolean NOT NULL DEFAULT false,
  checked_in_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tickets_qr_code_slug ON public.tickets (qr_code_slug);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id      ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_checked_in   ON public.tickets (checked_in);

-- ============================================================
-- 4. TABLE : announcements
-- Messages de l'admin visibles dans l'espace invité.
-- Inclut les infos de localisation de chaque édition.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  content      text NOT NULL,
  -- 'info' = annonce générale | 'location' = localisation prochaine édition
  type         text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'location')),
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements (is_published);

-- ============================================================
-- 5. FONCTION STOCKÉE : register_guest_atomically
-- Appelée par la Server Function Next.js APRÈS avoir créé
-- le compte Supabase Auth. Reçoit le user_id en paramètre.
-- ============================================================
CREATE OR REPLACE FUNCTION public.register_guest_atomically(
  p_token        uuid,
  p_user_id      uuid,
  p_first_name   text,
  p_last_name    text,
  p_email        text DEFAULT NULL,
  p_phone        text DEFAULT NULL,
  p_photo_url    text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation_id uuid;
  v_qr_code_slug  uuid;
BEGIN
  -- Verrouille la ligne (protection contre les soumissions simultanées)
  SELECT id INTO v_invitation_id
  FROM public.invitations
  WHERE token = p_token
    AND is_used = false
    AND expires_at > now()
  FOR UPDATE;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'INVITATION_INVALID'
      USING HINT = 'Token introuvable, déjà utilisé, ou expiré.';
  END IF;

  UPDATE public.invitations
  SET is_used = true
  WHERE id = v_invitation_id;

  v_qr_code_slug := gen_random_uuid();

  INSERT INTO public.tickets (
    invitation_id,
    qr_code_slug,
    user_id,
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    guest_photo_url
  ) VALUES (
    v_invitation_id,
    v_qr_code_slug,
    p_user_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_photo_url
  );

  RETURN v_qr_code_slug;
END;
$$;

-- ============================================================
-- 6. POLITIQUES RLS
-- ============================================================
ALTER TABLE public.invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- --- INVITATIONS : admins uniquement ---
CREATE POLICY "admins_all_invitations"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- --- TICKETS : l'invité lit/modifie UNIQUEMENT son propre ticket ---
CREATE POLICY "guest_own_ticket"
  ON public.tickets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --- TICKETS : les admins lisent tout ---
CREATE POLICY "admins_read_all_tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- --- TICKETS : lecture publique par qr_code_slug (page scan admin, non-auth)
-- Note : le scanner utilise une session admin, mais on garde aussi un accès anon pour la page ticket
CREATE POLICY "public_read_ticket_by_slug"
  ON public.tickets
  FOR SELECT
  TO anon
  USING (true);

-- --- ANNOUNCEMENTS : admins gèrent, invités connectés lisent les publiées ---
CREATE POLICY "admins_manage_announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "guests_read_published_announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ============================================================
-- 7. TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 8. BUCKET STORAGE pour les photos des invités
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-photos',
  'guest-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_guest_photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'guest-photos');

CREATE POLICY "auth_upload_guest_photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'guest-photos');

-- ============================================================
-- FIN — Vérifier dans Supabase :
--   ✅ Table Editor : invitations, tickets, announcements
--   ✅ Authentication → Providers → Email activé
--   ✅ Storage → bucket "guest-photos" créé
--
-- IMPORTANT après déploiement :
--   Pour chaque admin, aller dans Authentication → Users → Edit user
--   → ajouter dans "app_metadata" : { "role": "admin" }
-- ============================================================
