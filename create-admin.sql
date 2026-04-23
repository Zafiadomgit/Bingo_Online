-- Script para crear un usuario admin
-- Primero verificar la estructura de la tabla users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Crear usuario admin con campos mínimos
INSERT INTO users (
  id,
  email,
  password,
  display_name,
  role,
  credits
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@bingo.com',
  '$2b$12$VjRzlTPekLxg70IheDu1Pu/LQ3Fy219Y2VIBwPVtoQoMc5mCqto/C',
  'Administrador',
  'admin',
  999999
) ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  password = EXCLUDED.password;

-- Verificar que se creó correctamente
SELECT id, email, display_name FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
