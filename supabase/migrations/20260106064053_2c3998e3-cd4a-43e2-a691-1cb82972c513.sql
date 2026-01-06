-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for ad images
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-images');

CREATE POLICY "Authenticated users can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ad images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ad images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table for telegram channels to scrape
CREATE TABLE IF NOT EXISTS public.telegram_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_url TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_channels
CREATE POLICY "Admins can manage telegram channels"
ON public.telegram_channels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active channels"
ON public.telegram_channels
FOR SELECT
USING (is_active = true);