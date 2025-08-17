-- Fix personal board creation system

-- 1. First, let's create boards for existing users who don't have them
INSERT INTO public.boards (owner_id, name, visibility, sprint_capacity_points)
SELECT 
  u.id,
  'My Personal Board',
  'private',
  20
FROM auth.users u
LEFT JOIN public.boards b ON b.owner_id = u.id
WHERE b.id IS NULL;

-- 2. Create or replace the handle_new_user function that creates both profile and board
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
    (new_board_id, 'To Do', 1),
    (new_board_id, 'In Progress', 2),
    (new_board_id, 'Done', 3);

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile/board for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create lanes for existing boards that don't have them
INSERT INTO public.lanes (board_id, name, position)
SELECT 
  b.id,
  lane_data.name,
  lane_data.position
FROM public.boards b
CROSS JOIN (
  VALUES 
    ('To Do', 1),
    ('In Progress', 2),
    ('Done', 3)
) AS lane_data(name, position)
LEFT JOIN public.lanes l ON l.board_id = b.id AND l.name = lane_data.name
WHERE l.id IS NULL;