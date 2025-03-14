-- Migration: add_cover_photo_to_litters.sql
-- Created: 2025-03-12
-- Description: Adds cover_photo column to the litters table

-- Add cover_photo column to litters table
ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS litters_cover_photo_idx ON public.litters (cover_photo);
