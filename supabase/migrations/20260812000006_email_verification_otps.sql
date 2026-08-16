-- ====================================================================
-- MEDIRUSH EMAIL VERIFICATION OTPS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.email_verification_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  resend_count INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON public.email_verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_user_id ON public.email_verification_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_created ON public.email_verification_otps(created_at DESC);

-- Enable RLS
ALTER TABLE public.email_verification_otps ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, block public access
DROP POLICY IF EXISTS "Service role full access on email_verification_otps" ON public.email_verification_otps;
CREATE POLICY "Service role full access on email_verification_otps"
  ON public.email_verification_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);
