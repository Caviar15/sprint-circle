-- Clean up duplicate lanes
WITH lane_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY board_id, name ORDER BY created_at ASC) as rn
  FROM lanes
)
DELETE FROM lanes 
WHERE id IN (
  SELECT id FROM lane_duplicates WHERE rn > 1
);

-- Fix positions for remaining lanes
UPDATE lanes SET position = 0 WHERE name = 'To Do';
UPDATE lanes SET position = 1 WHERE name = 'In Progress';
UPDATE lanes SET position = 2 WHERE name = 'Done';