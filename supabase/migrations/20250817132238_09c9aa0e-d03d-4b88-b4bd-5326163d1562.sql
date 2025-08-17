-- Create user_connections table for peer-to-peer relationships
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Enable RLS on user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_connections
CREATE POLICY "Users can view their connections" 
ON public.user_connections 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections they're part of" 
ON public.user_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their connections" 
ON public.user_connections 
FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Function to get connected users for a given user
CREATE OR REPLACE FUNCTION public.get_connected_users(user_uuid uuid)
RETURNS TABLE(connected_user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN uc.user1_id = user_uuid THEN uc.user2_id
    ELSE uc.user1_id
  END as connected_user_id
  FROM public.user_connections uc
  WHERE (uc.user1_id = user_uuid OR uc.user2_id = user_uuid) 
    AND uc.status = 'accepted';
$$;

-- Function to check if two users are connected
CREATE OR REPLACE FUNCTION public.are_users_connected(user1_uuid uuid, user2_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_connections uc
    WHERE ((uc.user1_id = user1_uuid AND uc.user2_id = user2_uuid) 
           OR (uc.user1_id = user2_uuid AND uc.user2_id = user1_uuid))
      AND uc.status = 'accepted'
  );
$$;

-- Update handle_new_user function to create personal board automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_board_id uuid;
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Create personal board for the user
  INSERT INTO public.boards (owner_id, name, visibility, sprint_capacity_points)
  VALUES (NEW.id, 'My Personal Board', 'private', 20)
  RETURNING id INTO new_board_id;
  
  -- Create default lanes for the personal board
  INSERT INTO public.lanes (board_id, name, position) VALUES
    (new_board_id, 'To Do', 0),
    (new_board_id, 'In Progress', 1),
    (new_board_id, 'Done', 2);
  
  -- Add the user as owner of their personal board
  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (new_board_id, NEW.id, 'owner');
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create user setup for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Update tasks RLS policies to allow connected users to see tasks
DROP POLICY IF EXISTS "tasks_read_access" ON public.tasks;
CREATE POLICY "tasks_read_access" 
ON public.tasks 
FOR SELECT 
USING (
  creator_id = auth.uid() 
  OR are_users_connected(creator_id, auth.uid())
);

-- Only task creators can update their tasks
DROP POLICY IF EXISTS "tasks_update_access" ON public.tasks;
CREATE POLICY "tasks_update_access" 
ON public.tasks 
FOR UPDATE 
USING (creator_id = auth.uid());

-- Users can insert tasks on any board they have access to
DROP POLICY IF EXISTS "tasks_insert_access" ON public.tasks;
CREATE POLICY "tasks_insert_access" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  creator_id = auth.uid() 
  AND (is_board_owner(board_id, auth.uid()) OR is_board_member(board_id, auth.uid()))
);