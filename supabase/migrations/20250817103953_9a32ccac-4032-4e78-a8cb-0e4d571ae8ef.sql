-- Comprehensive fix for board loading and creation issues

-- Step 1: Fix the profile creation system
-- First, let's check if the trigger exists and recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create profiles for existing users who don't have them
INSERT INTO public.profiles (id, name, avatar_url)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', au.email) as name,
  au.raw_user_meta_data ->> 'avatar_url' as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Step 3: Create security definer functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_board_ids(user_uuid uuid)
RETURNS TABLE(board_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT bm.board_id
  FROM public.board_members bm
  WHERE bm.user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_board_member(board_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.board_members bm
    WHERE bm.board_id = board_uuid AND bm.user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_board_owner(board_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boards b
    WHERE b.id = board_uuid AND b.owner_id = user_uuid
  );
$$;

-- Step 4: Drop all problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "boards read for members" ON public.boards;
DROP POLICY IF EXISTS "board_members read" ON public.board_members;
DROP POLICY IF EXISTS "board_members insert by owner" ON public.board_members;
DROP POLICY IF EXISTS "board_members delete by owner" ON public.board_members;

-- Step 5: Create new non-recursive RLS policies using security definer functions

-- Boards policies
CREATE POLICY "boards_read_access" 
ON public.boards 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR 
  public.is_board_member(id, auth.uid())
);

-- Board members policies  
CREATE POLICY "board_members_read_access" 
ON public.board_members 
FOR SELECT 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  user_id = auth.uid()
);

CREATE POLICY "board_members_insert_by_owner" 
ON public.board_members 
FOR INSERT 
WITH CHECK (
  public.is_board_owner(board_id, auth.uid())
);

CREATE POLICY "board_members_delete_by_owner" 
ON public.board_members 
FOR DELETE 
USING (
  public.is_board_owner(board_id, auth.uid())
);

-- Step 6: Update other table policies to use security definer functions
-- Update lanes policies
DROP POLICY IF EXISTS "lanes read" ON public.lanes;
DROP POLICY IF EXISTS "lanes insert" ON public.lanes;
DROP POLICY IF EXISTS "lanes update" ON public.lanes;

CREATE POLICY "lanes_read_access" 
ON public.lanes 
FOR SELECT 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "lanes_insert_access" 
ON public.lanes 
FOR INSERT 
WITH CHECK (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "lanes_update_access" 
ON public.lanes 
FOR UPDATE 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

-- Update tasks policies
DROP POLICY IF EXISTS "tasks read" ON public.tasks;
DROP POLICY IF EXISTS "tasks insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks update" ON public.tasks;

CREATE POLICY "tasks_read_access" 
ON public.tasks 
FOR SELECT 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "tasks_insert_access" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "tasks_update_access" 
ON public.tasks 
FOR UPDATE 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

-- Update invites policies
DROP POLICY IF EXISTS "invites read" ON public.invites;
DROP POLICY IF EXISTS "invites insert by owner" ON public.invites;

CREATE POLICY "invites_read_access" 
ON public.invites 
FOR SELECT 
USING (
  public.is_board_owner(board_id, auth.uid())
  OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "invites_insert_by_owner" 
ON public.invites 
FOR INSERT 
WITH CHECK (
  public.is_board_owner(board_id, auth.uid())
);