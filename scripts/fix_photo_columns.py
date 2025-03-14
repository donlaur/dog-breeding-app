#!/usr/bin/env python3
"""
Script to add missing photo columns to Supabase database
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env file
load_dotenv()

# Get Supabase credentials
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

# Initialize Supabase client
supabase = create_client(supabase_url, supabase_key)

print("Connecting to Supabase...")

try:
    # First, let's check if we can connect to the database
    response = supabase.table("dogs").select("id").limit(1).execute()
    print(f"Successfully connected to Supabase. Found {len(response.data)} dogs.")
    
    # For Supabase, we need to use the SQL function to execute ALTER TABLE commands
    # This requires that you have a SQL function set up in your Supabase project
    
    print("\nTo fix the missing columns issue, please execute the following SQL statements in your Supabase SQL editor:")
    print("\n--- Copy and paste these statements into the Supabase SQL editor ---\n")
    
    sql_statements = [
        "-- Add cover_photo column to litters table if it doesn't exist",
        "ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);",
        "",
        "-- Add cover_photo_preview column to dogs table if it doesn't exist",
        "ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo_preview VARCHAR(255);",
        "",
        "-- Add cover_photo column to dogs table if it doesn't exist (if not already there)",
        "ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);",
        "",
        "-- Create indexes for faster lookups",
        "CREATE INDEX IF NOT EXISTS litters_cover_photo_idx ON public.litters (cover_photo);",
        "CREATE INDEX IF NOT EXISTS dogs_cover_photo_idx ON public.dogs (cover_photo);",
        "CREATE INDEX IF NOT EXISTS dogs_cover_photo_preview_idx ON public.dogs (cover_photo_preview);"
    ]
    
    for statement in sql_statements:
        print(statement)
    
    print("\n--- End of SQL statements ---\n")
    
    print("Instructions:")
    print("1. Log in to your Supabase dashboard")
    print("2. Go to the SQL Editor")
    print("3. Create a new query")
    print("4. Paste the SQL statements above")
    print("5. Run the query")
    print("\nAfter running these statements, you should be able to upload cover photos for both dogs and litters.")
    
except Exception as e:
    print(f"Error connecting to Supabase: {str(e)}")
    sys.exit(1)
