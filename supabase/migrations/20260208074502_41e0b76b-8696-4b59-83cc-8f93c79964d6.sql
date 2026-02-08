
-- Create table for storing OTP verification codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - no public policies needed, only service role (edge functions) access
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Index for quick lookup
CREATE INDEX idx_otp_codes_email_code ON public.otp_codes (email, code, used);

-- Auto-cleanup old codes (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_otp
AFTER INSERT ON public.otp_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otp_codes();
