#!/bin/bash
echo "Executing Photo Gallery RLS Policy Fix script..."

# Check if SUPABASE_URL and SUPABASE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
  echo "Please set them before running this script."
  exit 1
fi

# Get SQL content
SQL_FILE="./docs/migrations/fix_photos_rls.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file not found at $SQL_FILE"
  exit 1
fi

echo "Reading SQL from $SQL_FILE..."
SQL_CONTENT=$(cat "$SQL_FILE")

# Create a temporary file for curl to use
TEMP_FILE=$(mktemp)
echo "{\"query\": \"$SQL_CONTENT\"}" > "$TEMP_FILE"

echo "Sending SQL to Supabase..."
curl -s -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  --data @"$TEMP_FILE" \
  "$SUPABASE_URL/rest/sql"

# Remove the temporary file
rm "$TEMP_FILE"

echo "Photo Gallery RLS Policy Fix completed!"