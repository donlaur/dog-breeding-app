// Script to add missing photo columns to Supabase database
// Run with: node add_missing_columns.js

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to dogs and litters tables...');
    
    // Using raw SQL queries through the Supabase REST API
    
    // Add cover_photo column to litters table if it doesn't exist
    const littersResult1 = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);'
    });
    
    // Add cover_photo_preview column to dogs table if it doesn't exist
    const dogsResult1 = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo_preview VARCHAR(255);'
    });
    
    // Add cover_photo column to dogs table if it doesn't exist
    const dogsResult2 = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);'
    });
    
    console.log('Successfully added missing columns!');
    
    // Create indexes for faster lookups
    console.log('Creating indexes...');
    
    await supabase.rpc('execute_sql', {
      query: 'CREATE INDEX IF NOT EXISTS litters_cover_photo_idx ON public.litters (cover_photo);'
    });
    
    await supabase.rpc('execute_sql', {
      query: 'CREATE INDEX IF NOT EXISTS dogs_cover_photo_idx ON public.dogs (cover_photo);'
    });
    
    await supabase.rpc('execute_sql', {
      query: 'CREATE INDEX IF NOT EXISTS dogs_cover_photo_preview_idx ON public.dogs (cover_photo_preview);'
    });
    
    console.log('Successfully created indexes!');
    console.log('Database schema update complete.');
    
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
}

addMissingColumns();
