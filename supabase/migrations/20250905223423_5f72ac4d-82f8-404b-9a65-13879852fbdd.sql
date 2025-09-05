-- Clear all existing admin roles
DELETE FROM public.user_roles WHERE role = 'admin';

-- Add admin role only for tiagojnogueira@hotmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'tiagojnogueira@hotmail.com'
ON CONFLICT (user_id, role) DO NOTHING;