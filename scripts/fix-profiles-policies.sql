-- Script para arreglar las políticas RLS de la tabla profiles
-- Ejecutar este script en el SQL Editor del dashboard de Supabase

-- IMPORTANTE: Este script permite la gestión de perfiles de usuarios

-- 1. Verificar si RLS está habilitado en la tabla profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;

-- 4. Crear política para permitir que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 5. Crear política para permitir que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 6. Crear política para permitir inserción de perfiles (necesario para el registro)
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Crear política para permitir que administradores vean todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 8. Crear política para permitir que administradores actualicen perfiles
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 9. Verificar las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 10. Verificar la estructura de la tabla profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 11. Insertar perfiles necesarios (descomenta y ajusta según necesites)
-- Primero, necesitamos insertar el perfil del editor
INSERT INTO profiles (id, role, created_at) VALUES 
  ('a00cb5af-8ced-4309-81eb-aaf9cf31a222', 'editor', NOW())
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- 12. Verificar que se insertó correctamente
SELECT id, role, created_at FROM profiles WHERE id = 'a00cb5af-8ced-4309-81eb-aaf9cf31a222';

-- 13. Política alternativa más permisiva (solo para desarrollo)
-- Descomenta estas líneas si necesitas acceso completo para desarrollo
/*
-- Eliminar políticas restrictivas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Crear política que permita acceso completo a usuarios autenticados
CREATE POLICY "Allow all authenticated users full access to profiles" ON profiles
FOR ALL USING (auth.role() = 'authenticated');
*/ 