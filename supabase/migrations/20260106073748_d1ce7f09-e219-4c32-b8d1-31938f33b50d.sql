-- Allow admins to insert ads directly
CREATE POLICY "Admins can insert ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR
  (auth.uid() = user_id)
);

-- Drop the old insert policy that was too restrictive
DROP POLICY IF EXISTS "Authenticated users can create ads" ON public.ads;