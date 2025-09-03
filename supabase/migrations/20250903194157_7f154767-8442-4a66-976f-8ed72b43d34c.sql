-- Adicionar campos de horário noturno na tabela calculations
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS night_shift_start TIME DEFAULT '22:00';

ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS night_shift_end TIME DEFAULT '05:00';

ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS extend_night_hours BOOLEAN DEFAULT true;

ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS apply_night_reduction BOOLEAN DEFAULT true;