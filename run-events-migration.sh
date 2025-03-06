#!/bin/bash

# Script to run the events table migration
# This adds the events and event_rules tables to the database

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
else
  echo "No .env file found"
fi

# Check if we have the required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set"
  exit 1
fi

echo "Running events table migration..."

# Use psql to run the migration SQL
# For Supabase, we can use the REST API with the migration SQL
# Here we're creating a temporary file with the migration content
MIGRATION_FILE="./docs/migrations/add_events_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

echo "Running migration from $MIGRATION_FILE"

# Execute the migration using the Supabase REST API
# For safety, we'll print the command but mask the key
MASKED_KEY="${SUPABASE_KEY:0:5}...${SUPABASE_KEY: -5}"
echo "Executing migration via Supabase REST API with key $MASKED_KEY"

# Run the migration
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $MIGRATION_FILE | sed 's/"/\\"/g' | tr '\n' ' ')\"}"

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo -e "\nMigration completed successfully!"
  echo "Next steps:"
  echo "1. Run the script to generate events for existing entities:"
  echo "   python generate_all_events.py"
  echo "2. Restart the server to apply the changes"
else
  echo -e "\nMigration failed. Please check the error message above."
fi