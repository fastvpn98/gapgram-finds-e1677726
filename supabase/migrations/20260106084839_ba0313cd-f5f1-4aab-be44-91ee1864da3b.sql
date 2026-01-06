-- Drop and recreate the policy to allow admins to insert ads without matching user_id
DROP POLICY IF EXISTS "Admins can insert ads" ON public.ads;

CREATE POLICY "Admins can insert ads" ON public.ads
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR 
  auth.uid() = user_id
);