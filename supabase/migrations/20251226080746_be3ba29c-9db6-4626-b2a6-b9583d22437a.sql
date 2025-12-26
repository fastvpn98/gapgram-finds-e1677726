-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add approval columns to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Add check constraint for status
ALTER TABLE public.ads ADD CONSTRAINT ads_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create ad_likes table
CREATE TABLE public.ad_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (ad_id, user_id)
);

ALTER TABLE public.ad_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON public.ad_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.ad_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.ad_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create ad_views table for analytics
CREATE TABLE public.ad_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    session_id TEXT
);

ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views"
ON public.ad_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all views"
ON public.ad_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create ad_clicks table for analytics
CREATE TABLE public.ad_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    session_id TEXT
);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks"
ON public.ad_clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
ON public.ad_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create site_visits table
CREATE TABLE public.site_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    page_path TEXT,
    session_id TEXT
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits"
ON public.site_visits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all visits"
ON public.site_visits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update ads RLS policy to show only approved ads publicly, but owners and admins can see all
DROP POLICY IF EXISTS "Anyone can view ads" ON public.ads;

CREATE POLICY "Public can view approved ads"
ON public.ads FOR SELECT
USING (
    is_approved = true 
    OR auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
);

-- Admins and moderators can update any ad (for approval)
CREATE POLICY "Admins can update all ads"
ON public.ads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_likes_ad_id ON public.ad_likes(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_likes_user_id ON public.ad_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON public.ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON public.ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON public.site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_is_approved ON public.ads(is_approved);