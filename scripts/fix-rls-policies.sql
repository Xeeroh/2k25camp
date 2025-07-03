-- Script para arreglar las políticas RLS de Supabase
-- Ejecutar este script en el SQL Editor del dashboard de Supabase

-- IMPORTANTE: Este script mantiene el acceso anónimo para registros
-- pero restringe la lectura solo a usuarios autenticados con roles

-- 1. Primero, verificar si RLS está habilitado en la tabla attendees
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'attendees';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Allow authenticated users to read attendees" ON attendees;
DROP POLICY IF EXISTS "Allow editors to read attendees" ON attendees;
DROP POLICY IF EXISTS "Allow admins to read attendees" ON attendees;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON attendees;
DROP POLICY IF EXISTS "Allow anonymous registration" ON attendees;
DROP POLICY IF EXISTS "Allow all users to insert" ON attendees;

-- 4. Crear política para permitir REGISTROS ANÓNIMOS (INSERT)
-- Esta es crucial para que los asistentes puedan registrarse
CREATE POLICY "Allow anonymous registration" ON attendees
FOR INSERT WITH CHECK (true);

-- 5. Crear política para permitir LECTURA solo a usuarios autenticados con roles
CREATE POLICY "Allow authenticated staff to read attendees" ON attendees
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    -- Permitir acceso si el usuario tiene un perfil con rol admin o editor
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
    -- O permitir acceso si no hay tabla profiles (fallback para desarrollo)
    OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
  )
);

-- 6. Crear política para permitir ACTUALIZACIÓN solo a administradores
CREATE POLICY "Allow admins to update attendees" ON attendees
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 7. Crear política para permitir ELIMINACIÓN solo a administradores
CREATE POLICY "Allow admins to delete attendees" ON attendees
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 8. Verificar las políticas creadas
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
WHERE tablename = 'attendees';

-- 9. Verificar que la tabla profiles existe y tiene datos
SELECT COUNT(*) as total_profiles FROM profiles;

-- 10. Si la tabla profiles está vacía, insertar perfiles necesarios
-- (Descomenta y ajusta estos valores según tus usuarios)
/*
INSERT INTO profiles (id, role, created_at) VALUES 
  ('a00cb5af-8ced-4309-81eb-aaf9cf31a222', 'editor', NOW()),  -- Usuario editor
  ('ID_DEL_ADMIN_AQUI', 'admin', NOW())  -- Reemplazar con el ID del admin
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
*/

-- 11. Política alternativa más permisiva (solo para desarrollo)
-- Descomenta estas líneas si necesitas acceso completo para desarrollo
/*
-- Eliminar políticas restrictivas
DROP POLICY IF EXISTS "Allow authenticated staff to read attendees" ON attendees;

-- Crear política que permita acceso a todos los usuarios autenticados
CREATE POLICY "Allow all authenticated users to read attendees" ON attendees
FOR SELECT USING (auth.role() = 'authenticated');
*/

-- 12. Verificar que todo funciona
-- Esta consulta debería funcionar para usuarios autenticados con roles
-- SELECT COUNT(*) FROM attendees; 