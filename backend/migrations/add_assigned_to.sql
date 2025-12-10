-- Add assigned_to column to tasks table for task assignment feature
-- Drop column if exists first
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_to;

-- Add with correct UUID type
ALTER TABLE tasks ADD COLUMN assigned_to UUID;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
