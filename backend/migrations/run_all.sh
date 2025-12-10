#!/bin/sh
psql -U postgres -d taskmanagement -f /tmp/migrations/001_create_tables.sql
psql -U postgres -d taskmanagement -f /tmp/migrations/002_add_collaboration.sql
psql -U postgres -d taskmanagement -f /tmp/migrations/add_assigned_to.sql
echo "✓ All migrations completed!"