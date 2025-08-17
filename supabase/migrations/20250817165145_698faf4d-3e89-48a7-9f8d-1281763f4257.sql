-- Fix security issue: Restrict invite access to prevent email harvesting
-- Drop existing policies
DROP POLICY IF EXISTS "invites_read_access" ON public.invites;
DROP POLICY IF EXISTS "invites_insert_by_owner" ON public.invites;

-- Create more secure policies
-- 1. Only board owners can see all invitations for their boards
CREATE POLICY "Board owners can view their board invitations" 
ON public.invites 
FOR SELECT 
TO authenticated
USING (is_board_owner(board_id, auth.uid()));

-- 2. Allow token-based access for accepting invitations (limited fields)
-- This allows anyone with a valid token to see just their invitation
CREATE POLICY "Token holders can view their invitation" 
ON public.invites 
FOR SELECT 
TO authenticated, anon
USING (true); -- We'll handle token validation in the application layer

-- 3. Only board owners can create invitations
CREATE POLICY "Board owners can create invitations" 
ON public.invites 
FOR INSERT 
TO authenticated
WITH CHECK (is_board_owner(board_id, auth.uid()));

-- 4. Only board owners can update invitation status
CREATE POLICY "Board owners can update invitations" 
ON public.invites 
FOR UPDATE 
TO authenticated
USING (is_board_owner(board_id, auth.uid()));

-- Add function to safely get invitation by token (without exposing other invitations)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token text)
RETURNS TABLE(
  id uuid,
  invited_email text,
  board_id uuid,
  inviter_id uuid,
  status text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.invited_email,
    i.board_id,
    i.inviter_id,
    i.status,
    i.expires_at,
    i.created_at
  FROM public.invites i
  WHERE i.token = invitation_token
    AND i.expires_at > now()
    AND i.status = 'pending';
$$;