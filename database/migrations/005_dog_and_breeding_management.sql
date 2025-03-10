-- Migration: 005_dog_and_breeding_management.sql
-- Created: 2025-03-10
-- Description: Core dog breeding and management tables

-- Create dog_breeds table
CREATE TABLE IF NOT EXISTS public.dog_breeds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    average_weight VARCHAR(100),
    average_height VARCHAR(100),
    lifespan VARCHAR(100),
    temperament TEXT,
    health_concerns TEXT,
    grooming_needs TEXT,
    activity_level VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create dogs table
CREATE TABLE IF NOT EXISTS public.dogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    breed_id INTEGER REFERENCES public.dog_breeds(id),
    date_of_birth DATE,
    gender VARCHAR(10),
    color VARCHAR(100),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    registration_number VARCHAR(100),
    microchip_number VARCHAR(100),
    pedigree_url TEXT,
    health_tested BOOLEAN DEFAULT FALSE,
    notes TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    is_breeding_dog BOOLEAN DEFAULT FALSE,
    sire_id INTEGER REFERENCES public.dogs(id),
    dam_id INTEGER REFERENCES public.dogs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create dog_photos table
CREATE TABLE IF NOT EXISTS public.dog_photos (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES public.dogs(id),
    url TEXT NOT NULL,
    caption VARCHAR(255),
    is_profile_picture BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create heats table
CREATE TABLE IF NOT EXISTS public.heats (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES public.dogs(id),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    symptoms TEXT[],
    intensity VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create litters table
CREATE TABLE IF NOT EXISTS public.litters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    dam_id INTEGER REFERENCES public.dogs(id),
    sire_id INTEGER REFERENCES public.dogs(id),
    breeding_date DATE,
    due_date DATE,
    whelping_date DATE,
    puppy_count INTEGER,
    males_count INTEGER,
    females_count INTEGER,
    deceased_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create puppies table
CREATE TABLE IF NOT EXISTS public.puppies (
    id SERIAL PRIMARY KEY,
    litter_id INTEGER REFERENCES public.litters(id),
    name VARCHAR(255),
    identifier VARCHAR(100),
    gender VARCHAR(10),
    color VARCHAR(100),
    markings TEXT,
    birth_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    birth_date DATE,
    status VARCHAR(50) DEFAULT 'available',
    reserved_by INTEGER REFERENCES public.customers(id),
    sold_date DATE,
    sold_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create photos table (general photos)
CREATE TABLE IF NOT EXISTS public.photos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    dog_id INTEGER REFERENCES public.dogs(id),
    puppy_id INTEGER REFERENCES public.puppies(id),
    litter_id INTEGER REFERENCES public.litters(id),
    is_profile_picture BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.dog_breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puppies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY dog_breeds_policy ON public.dog_breeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY dogs_policy ON public.dogs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY dog_photos_policy ON public.dog_photos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY heats_policy ON public.heats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY litters_policy ON public.litters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY puppies_policy ON public.puppies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY photos_policy ON public.photos FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS dogs_breed_id_idx ON public.dogs (breed_id);
CREATE INDEX IF NOT EXISTS dogs_sire_id_idx ON public.dogs (sire_id);
CREATE INDEX IF NOT EXISTS dogs_dam_id_idx ON public.dogs (dam_id);
CREATE INDEX IF NOT EXISTS dog_photos_dog_id_idx ON public.dog_photos (dog_id);
CREATE INDEX IF NOT EXISTS heats_dog_id_idx ON public.heats (dog_id);
CREATE INDEX IF NOT EXISTS litters_dam_id_idx ON public.litters (dam_id);
CREATE INDEX IF NOT EXISTS litters_sire_id_idx ON public.litters (sire_id);
CREATE INDEX IF NOT EXISTS puppies_litter_id_idx ON public.puppies (litter_id);
CREATE INDEX IF NOT EXISTS puppies_reserved_by_idx ON public.puppies (reserved_by);
CREATE INDEX IF NOT EXISTS photos_dog_id_idx ON public.photos (dog_id);
CREATE INDEX IF NOT EXISTS photos_puppy_id_idx ON public.photos (puppy_id);
CREATE INDEX IF NOT EXISTS photos_litter_id_idx ON public.photos (litter_id);
