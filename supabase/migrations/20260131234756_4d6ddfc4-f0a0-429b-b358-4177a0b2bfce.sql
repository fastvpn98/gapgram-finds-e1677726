-- Add platform column to ads table for messenger type
ALTER TABLE public.ads 
ADD COLUMN platform text NOT NULL DEFAULT 'telegram';

-- Add comment for clarity
COMMENT ON COLUMN public.ads.platform IS 'Messenger platform: telegram, eitaa, bale, rubika';