-- Fix policy: Allow admins to insert regardless of user_id value
DROP POLICY IF EXISTS "Admins can insert ads" ON public.ads;

CREATE POLICY "Admins and users can insert ads" ON public.ads
FOR INSERT WITH CHECK (
  -- Admins/moderators can insert any ad
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR 
  -- Regular users can only insert their own ads
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);