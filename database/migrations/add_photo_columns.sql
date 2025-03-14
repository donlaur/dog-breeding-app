-- Migration: add_photo_columns.sql
-- Created: 2025-03-12
-- Description: Adds missing photo-related columns to dogs and litters tables

-- Add cover_photo column to litters table if it doesn't exist
ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);

-- Add cover_photo_preview column to dogs table if it doesn't exist
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo_preview VARCHAR(255);

-- Add cover_photo column to dogs table if it doesn't exist
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS litters_cover_photo_idx ON public.litters (cover_photo);
CREATE INDEX IF NOT EXISTS dogs_cover_photo_idx ON public.dogs (cover_photo);
CREATE INDEX IF NOT EXISTS dogs_cover_photo_preview_idx ON public.dogs (cover_photo_preview);
