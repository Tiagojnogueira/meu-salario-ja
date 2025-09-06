-- Adicionar campo active na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Criar índice para melhor performance
CREATE INDEX idx_profiles_active ON public.profiles(active);

-- Garantir que todos os usuários existentes sejam marcados como ativos
UPDATE public.profiles SET active = true WHERE active IS NULL;