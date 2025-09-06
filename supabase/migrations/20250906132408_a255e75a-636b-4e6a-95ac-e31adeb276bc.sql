-- Adicionar role 'user' para Ludmila
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'::app_role
FROM public.profiles p
WHERE p.email = 'tiagojnogueira@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.user_id
);