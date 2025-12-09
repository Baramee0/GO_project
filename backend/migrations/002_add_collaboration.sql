-- Migration 002: Add Collaboration Features
-- This migration adds support for projects, roles, and collaboration

-- 1. Add system_role to users table
ALTER TABLE users ADD COLUMN system_role VARCHAR(20) DEFAULT 'user';
CREATE INDEX idx_users_system_role ON users(system_role);

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

-- 4. Add project_id to tasks table
ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_project_id ON tasks(project_id);

-- 5. Data Migration: Create default projects for existing users
DO $$
DECLARE
    user_record RECORD;
    new_project_id UUID;
BEGIN
    FOR user_record IN SELECT id, name, email FROM users LOOP
        -- Create a personal project for each user
        INSERT INTO projects (name, description)
        VALUES (
            user_record.name || '''s Personal Tasks',
            'Default project for ' || user_record.email
        )
        RETURNING id INTO new_project_id;
        
        -- Add user as PO (Product Owner) of their project
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (new_project_id, user_record.id, 'PO');
        
        -- Move all existing tasks to this project
        UPDATE tasks
        SET project_id = new_project_id
        WHERE user_id = user_record.id;
    END LOOP;
END $$;

-- 6. Make project_id NOT NULL after migration
ALTER TABLE tasks ALTER COLUMN project_id SET NOT NULL;
