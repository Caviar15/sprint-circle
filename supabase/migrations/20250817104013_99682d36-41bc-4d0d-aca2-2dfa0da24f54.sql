-- Fix security definer function search_path issues
-- Add SET search_path = 'public' to all security definer functions

-- Fix get_user_board_ids function
CREATE OR REPLACE FUNCTION public.get_user_board_ids(user_uuid uuid)
RETURNS TABLE(board_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT bm.board_id
  FROM public.board_members bm
  WHERE bm.user_id = user_uuid;
$$;

-- Fix is_board_member function
CREATE OR REPLACE FUNCTION public.is_board_member(board_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.board_members bm
    WHERE bm.board_id = board_uuid AND bm.user_id = user_uuid
  );
$$;

-- Fix is_board_owner function
CREATE OR REPLACE FUNCTION public.is_board_owner(board_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boards b
    WHERE b.id = board_uuid AND b.owner_id = user_uuid
  );
$$;