-- Verificar y crear perfil para usuarios existentes que no tengan perfil
INSERT INTO public.profiles (id, email, display_name, credits)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)) as display_name,
  1000 as credits
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar que el trigger existe y está activo
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
