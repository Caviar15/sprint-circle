-- Create test data for cross-user task visibility testing

-- First, let's create a connection between two existing users
INSERT INTO user_connections (user1_id, user2_id, invited_by, status, accepted_at)
VALUES (
  '8883a607-8963-477a-93bc-f7c263ecd1e6',  -- test.user.ddfb56eb@gmail.com
  '6cc63f23-3ae2-459c-822c-41f779e69866',  -- test.user.8b86e7c0@gmail.com
  '8883a607-8963-477a-93bc-f7c263ecd1e6',
  'accepted',
  now()
);

-- Get the board IDs for these users so we can create tasks
-- Let's assume each user has their own board (created automatically)

-- Create some test tasks for the second user in different lanes
-- First, find the board and lanes for user 6cc63f23-3ae2-459c-822c-41f779e69866
DO $$
DECLARE
    user2_board_id uuid;
    todo_lane_id uuid;
    progress_lane_id uuid;
    done_lane_id uuid;
BEGIN
    -- Get user2's board
    SELECT b.id INTO user2_board_id 
    FROM boards b 
    WHERE b.owner_id = '6cc63f23-3ae2-459c-822c-41f779e69866' 
    LIMIT 1;
    
    IF user2_board_id IS NOT NULL THEN
        -- Get lane IDs for user2's board
        SELECT id INTO todo_lane_id FROM lanes WHERE board_id = user2_board_id AND name = 'To Do';
        SELECT id INTO progress_lane_id FROM lanes WHERE board_id = user2_board_id AND name = 'In Progress';
        SELECT id INTO done_lane_id FROM lanes WHERE board_id = user2_board_id AND name = 'Done';
        
        -- Create test tasks for user2 in different lanes
        INSERT INTO tasks (board_id, lane_id, title, description, creator_id, estimate_points, position) VALUES
        (user2_board_id, todo_lane_id, 'User2 Todo Task', 'This task should appear in User1 Todo lane', '6cc63f23-3ae2-459c-822c-41f779e69866', 3, 0),
        (user2_board_id, progress_lane_id, 'User2 In Progress Task', 'This task should appear in User1 In Progress lane', '6cc63f23-3ae2-459c-822c-41f779e69866', 5, 0),
        (user2_board_id, done_lane_id, 'User2 Done Task', 'This task should appear in User1 Done lane', '6cc63f23-3ae2-459c-822c-41f779e69866', 2, 0);
        
        RAISE NOTICE 'Created test tasks for user2 in board %', user2_board_id;
    ELSE
        RAISE NOTICE 'No board found for user2';
    END IF;
END $$;