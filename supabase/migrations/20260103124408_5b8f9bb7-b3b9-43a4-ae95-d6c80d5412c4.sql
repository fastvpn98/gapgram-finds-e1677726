-- Add type column to ads table (group or channel)
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_type TEXT NOT NULL DEFAULT 'group' CHECK (ad_type IN ('group', 'channel'));

-- Rename cities to provinces (the column stores province data now)
-- Note: We're keeping the column name as 'cities' in the database but treating it as provinces in the app
-- This avoids breaking existing data
COMMENT ON COLUMN public.ads.cities IS 'Stores province values (renamed from cities)';