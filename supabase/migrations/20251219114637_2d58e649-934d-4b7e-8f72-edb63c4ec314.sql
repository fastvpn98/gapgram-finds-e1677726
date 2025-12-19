-- Update handle_new_user function with input validation and sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  safe_display_name TEXT;
BEGIN
  -- Extract and validate display_name from various OAuth providers
  safe_display_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'name'), '')
  );
  
  -- Limit length to prevent abuse (max 100 characters)
  safe_display_name := LEFT(safe_display_name, 100);
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, safe_display_name);
  
  RETURN new;
END;
$$;

-- Add constraint to profiles table to enforce display_name length limit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_name_length'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100);
  END IF;
END $$;