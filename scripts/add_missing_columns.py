#!/usr/bin/env python3
"""
Script to add missing photo columns to Supabase database
Run with: python scripts/add_missing_columns.py
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Add the project root to the path so we can import from server
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

def add_missing_columns():
    """Add missing photo columns to dogs and litters tables"""
    
    # Get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        sys.exit(1)
    
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        print("Adding missing columns to dogs and litters tables...")
        
        # Execute SQL queries to add missing columns
        queries = [
            # Add cover_photo column to litters table
            "ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);",
            
            # Add cover_photo_preview column to dogs table
            "ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo_preview VARCHAR(255);",
            
            # Add cover_photo column to dogs table if it doesn't exist
            "ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);",
            
            # Create indexes for faster lookups
            "CREATE INDEX IF NOT EXISTS litters_cover_photo_idx ON public.litters (cover_photo);",
            "CREATE INDEX IF NOT EXISTS dogs_cover_photo_idx ON public.dogs (cover_photo);",
            "CREATE INDEX IF NOT EXISTS dogs_cover_photo_preview_idx ON public.dogs (cover_photo_preview);"
        ]
        
        # Execute each query
        for query in queries:
            print(f"Executing: {query}")
            # Using the REST API to execute SQL
            supabase.table("_rpc").select("*").execute(
                {"name": "execute_sql", "params": {"query": query}}
            )
        
        print("Successfully updated database schema!")
        
    except Exception as e:
        print(f"Error updating database schema: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    add_missing_columns()
