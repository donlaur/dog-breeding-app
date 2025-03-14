-- Create migration file for adding puppy_id to dogs table
ALTER TABLE IF EXISTS public.dogs ADD COLUMN IF NOT EXISTS puppy_id INTEGER REFERENCES public.puppies(id);
CREATE INDEX IF NOT EXISTS dogs_puppy_id_idx ON public.dogs(puppy_id);
