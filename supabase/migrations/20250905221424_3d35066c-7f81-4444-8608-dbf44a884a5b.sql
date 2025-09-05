-- Add phone and office_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN office_name TEXT;