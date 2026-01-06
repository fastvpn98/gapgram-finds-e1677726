-- Drop existing insert policy
DROP POLICY IF EXISTS "Admins and users can insert ads" ON public.ads;

-- Create new insert policy that allows admins to insert ads with any user_id
CREATE POLICY "Users and admins can insert ads" 
ON public.ads 
FOR INSERT 
TO public
WITH CHECK (
  -- Admins and moderators can insert any ad
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR 
  -- Regular users can only insert their own ads
  (auth.uid() IS NOT NULL AND (user_id IS NULL OR auth.uid() = user_id))
);