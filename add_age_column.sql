-- ============================================================
-- MIGRATION : Ajout du champ age
-- Colle ce script dans Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Ajout de la colonne age sur la table tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS guest_age integer;

-- 2. Mise à jour de la fonction RPC pour inclure l'age
CREATE OR REPLACE FUNCTION public.register_guest_atomically(
  p_token        uuid,
  p_user_id      uuid,
  p_first_name   text,
  p_last_name    text,
  p_age          integer,
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

  UPDATE public.invitations SET is_used = true WHERE id = v_invitation_id;

  v_qr_code_slug := gen_random_uuid();

  INSERT INTO public.tickets (
    invitation_id, qr_code_slug, user_id,
    guest_first_name, guest_last_name, guest_age,
    guest_email, guest_phone, guest_photo_url
  ) VALUES (
    v_invitation_id, v_qr_code_slug, p_user_id,
    p_first_name, p_last_name, p_age,
    p_email, p_phone, p_photo_url
  );

  RETURN v_qr_code_slug;
END;
$$;
