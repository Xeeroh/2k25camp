-- Script completo para arreglar todas las políticas RLS
-- Ejecutar este script en el SQL Editor del dashboard de Supabase

-- ========================================
-- 1. ARREGLAR POLÍTICAS DE LA TABLA PROFILES
-- ========================================

-- Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;

-- Crear políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. ARREGLAR POLÍTICAS DE LA TABLA ATTENDEES
-- ========================================

-- Habilitar RLS en attendees
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de attendees
DROP POLICY IF EXISTS "Allow authenticated users to read attendees" ON attendees;
DROP POLICY IF EXISTS "Allow editors to read attendees" ON attendees;
DROP POLICY IF EXISTS "Allow admins to read attendees" ON attendees;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON attendees;
DROP POLICY IF EXISTS "Allow anonymous registration" ON attendees;
DROP POLICY IF EXISTS "Allow all users to insert" ON attendees;

-- Crear políticas para attendees
-- Permitir registros anónimos (crucial para que los asistentes se registren)
CREATE POLICY "Allow anonymous registration" ON attendees
FOR INSERT WITH CHECK (true);

-- Permitir lectura solo a usuarios autenticados con roles
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

-- Permitir actualización solo a administradores
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

-- Permitir eliminación solo a administradores
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

-- ========================================
-- 3. CREAR PERFILES NECESARIOS
-- ========================================

-- Insertar perfil del editor
INSERT INTO profiles (id, role, created_at) VALUES 
  ('a00cb5af-8ced-4309-81eb-aaf9cf31a222', 'editor', NOW())
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- ========================================
-- 4. VERIFICAR TODO
-- ========================================

-- Verificar políticas de profiles
SELECT 'PROFILES POLICIES:' as info;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar políticas de attendees
SELECT 'ATTENDEES POLICIES:' as info;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'attendees';

-- Verificar perfiles creados
SELECT 'PROFILES CREATED:' as info;
SELECT id, role, created_at FROM profiles;

-- Verificar que las políticas funcionan
SELECT 'TESTING ACCESS:' as info;
SELECT COUNT(*) as total_attendees FROM attendees;

-- ========================================
-- 5. POLÍTICAS ALTERNATIVAS (DESARROLLO)
-- ========================================

-- Si las políticas anteriores no funcionan, descomenta estas líneas:
/*
-- Políticas más permisivas para desarrollo
DROP POLICY IF EXISTS "Allow authenticated staff to read attendees" ON attendees;
CREATE POLICY "Allow all authenticated users to read attendees" ON attendees
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
CREATE POLICY "Allow all authenticated users full access to profiles" ON profiles
FOR ALL USING (auth.role() = 'authenticated');
*/ 