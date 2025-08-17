-- Fix infinite recursion in boards RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "boards read for members" ON public.boards;

-- Create a corrected policy that doesn't cause recursion
CREATE POLICY "boards read for members" 
ON public.boards 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR 
  id IN (
    SELECT board_id 
    FROM board_members 
    WHERE user_id = auth.uid()
  )
);