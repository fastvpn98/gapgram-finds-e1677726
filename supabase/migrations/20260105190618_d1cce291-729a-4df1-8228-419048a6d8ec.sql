-- Add deleted_at column for soft delete
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ads_deleted_at ON public.ads(deleted_at);

-- Drop the old DELETE policy for users (they still can't delete, we'll use soft delete)
DROP POLICY IF EXISTS "Users can delete their own ads" ON public.ads;

-- Update the SELECT policy to exclude soft-deleted ads
DROP POLICY IF EXISTS "Public can view approved ads" ON public.ads;

CREATE POLICY "Public can view approved ads" 
ON public.ads 
FOR SELECT 
USING (
  deleted_at IS NULL AND (
    (is_approved = true) OR 
    (auth.uid() = user_id) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  )
);

-- Create a separate policy for admins to see deleted ads too
CREATE POLICY "Admins can view deleted ads" 
ON public.ads 
FOR SELECT 
USING (
  deleted_at IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  )
);