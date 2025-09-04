-- Add columns for detailed working hours configuration
ALTER TABLE public.calculations 
ADD COLUMN detailed_working_hours jsonb DEFAULT null,
ADD COLUMN auto_fill_enabled boolean DEFAULT false;

-- Add index for better performance on auto_fill_enabled queries
CREATE INDEX idx_calculations_auto_fill_enabled ON public.calculations(auto_fill_enabled) WHERE auto_fill_enabled = true;