-- Fix the overly permissive token policy
DROP POLICY IF EXISTS "Token holders can view their invitation" ON public.invites;

-- Create a more secure policy that only allows access through the secure function
-- Remove direct table access for token-based queries
-- Users should only access invitations through the secure function