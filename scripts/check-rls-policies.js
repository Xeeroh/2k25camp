const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Obtener credenciales desde las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno necesarias no encontradas.');
  console.error('Asegúrate de tener configurado NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env');
  process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Verificando políticas RLS de Supabase...\n');

    // 1. Verificar si RLS está habilitado en la tabla attendees
    console.log('1. Verificando si RLS está habilitado en la tabla attendees...');
    
    // Intentar una consulta simple para ver si hay restricciones
    const { data: testData, error: testError } = await supabase
      .from('attendees')
      .select('count')
      .limit(1);
      
    console.log('   Resultado de consulta de prueba:', {
      hasData: !!testData,
      error: testError,
      status: testError ? 'Error' : 'Éxito'
    });

    // 2. Verificar la tabla profiles para entender los roles
    console.log('\n2. Verificando tabla profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(10);
      
    if (profilesError) {
      console.log('   Error al consultar profiles:', profilesError.message);
    } else {
      console.log('   Perfiles encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('   Roles disponibles:');
        const roles = [...new Set(profiles.map(p => p.role))];
        roles.forEach(role => {
          const count = profiles.filter(p => p.role === role).length;
          console.log(`     - ${role}: ${count} usuarios`);
        });
      }
    }

    // 3. Verificar si hay políticas específicas que bloqueen el acceso
    console.log('\n3. Verificando acceso con diferentes roles...');
    
    // Simular acceso como usuario anónimo
    console.log('   Probando acceso anónimo...');
    const { data: anonData, error: anonError } = await supabase
      .from('attendees')
      .select('id, firstname, lastname')
      .limit(5);
      
    console.log('   Acceso anónimo:', {
      canAccess: !!anonData && anonData.length > 0,
      count: anonData?.length || 0,
      error: anonError?.message
    });

    // 4. Verificar la estructura de la tabla attendees
    console.log('\n4. Verificando estructura de la tabla attendees...');
    const { data: structureData, error: structureError } = await supabase
      .from('attendees')
      .select('*')
      .limit(1);
      
    if (structureError) {
      console.log('   Error al verificar estructura:', structureError.message);
    } else if (structureData && structureData.length > 0) {
      console.log('   Columnas disponibles:', Object.keys(structureData[0]));
    } else {
      console.log('   No se pueden ver las columnas (probablemente bloqueado por RLS)');
    }

    // 5. Recomendaciones
    console.log('\n📋 RECOMENDACIONES:');
    console.log('   Si el acceso anónimo funciona pero el acceso autenticado no,');
    console.log('   el problema está en las políticas RLS que requieren autenticación.');
    console.log('');
    console.log('   Para solucionarlo, necesitas:');
    console.log('   1. Ir al dashboard de Supabase');
    console.log('   2. Navegar a Authentication > Policies');
    console.log('   3. Buscar la tabla "attendees"');
    console.log('   4. Verificar que exista una política que permita acceso a usuarios autenticados');
    console.log('   5. O crear una política como:');
    console.log('');
    console.log('   CREATE POLICY "Allow authenticated users to read attendees" ON attendees');
    console.log('   FOR SELECT USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('   O más específicamente para editores:');
    console.log('');
    console.log('   CREATE POLICY "Allow editors to read attendees" ON attendees');
    console.log('   FOR SELECT USING (');
    console.log('     EXISTS (');
    console.log('       SELECT 1 FROM profiles');
    console.log('       WHERE profiles.id = auth.uid()');
    console.log('       AND profiles.role IN (\'admin\', \'editor\')');
    console.log('     )');
    console.log('   );');

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la verificación
checkRLSPolicies(); 