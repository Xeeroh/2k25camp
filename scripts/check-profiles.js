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

async function checkAndFixProfiles() {
  try {
    console.log('🔍 Verificando tabla profiles...\n');

    // 1. Verificar si la tabla profiles existe
    console.log('1. Verificando si la tabla profiles existe...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.log('   ❌ La tabla profiles no existe o no es accesible:', tableError.message);
      console.log('   Necesitas crear la tabla profiles en Supabase.');
      return;
    }
    
    console.log('   ✅ La tabla profiles existe');

    // 2. Verificar cuántos perfiles hay
    console.log('\n2. Verificando cantidad de perfiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, created_at');
      
    if (profilesError) {
      console.log('   ❌ Error al consultar profiles:', profilesError.message);
      return;
    }
    
    console.log(`   📊 Total de perfiles: ${profiles?.length || 0}`);
    
    if (profiles && profiles.length > 0) {
      console.log('   📋 Perfiles existentes:');
      profiles.forEach((profile, index) => {
        console.log(`     ${index + 1}. ID: ${profile.id}, Rol: ${profile.role}, Creado: ${profile.created_at}`);
      });
    } else {
      console.log('   ⚠️  No hay perfiles en la tabla');
    }

    // 3. Verificar si necesitamos crear perfiles
    console.log('\n3. Verificando si necesitamos crear perfiles...');
    
    // IDs conocidos de usuarios (del log anterior)
    const knownUsers = [
      { id: 'a00cb5af-8ced-4309-81eb-aaf9cf31a222', role: 'editor', email: 'helenahdz98@gmail.com' }
    ];
    
    const missingProfiles = [];
    
    for (const user of knownUsers) {
      const existingProfile = profiles?.find(p => p.id === user.id);
      if (!existingProfile) {
        missingProfiles.push(user);
        console.log(`   ❌ Falta perfil para: ${user.email} (${user.id}) con rol ${user.role}`);
      } else {
        console.log(`   ✅ Perfil existe para: ${user.email} con rol ${existingProfile.role}`);
      }
    }

    // 4. Crear perfiles faltantes
    if (missingProfiles.length > 0) {
      console.log('\n4. Creando perfiles faltantes...');
      
      for (const profile of missingProfiles) {
        try {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: profile.id,
              role: profile.role,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
            
          if (insertError) {
            console.log(`   ❌ Error al crear perfil para ${profile.email}:`, insertError.message);
          } else {
            console.log(`   ✅ Perfil creado para ${profile.email} con rol ${profile.role}`);
          }
        } catch (error) {
          console.log(`   ❌ Error al crear perfil para ${profile.email}:`, error.message);
        }
      }
    } else {
      console.log('\n4. ✅ Todos los perfiles necesarios ya existen');
    }

    // 5. Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...');
    console.log('   Para verificar las políticas RLS, ejecuta en el SQL Editor de Supabase:');
    console.log('');
    console.log('   SELECT');
    console.log('     schemaname,');
    console.log('     tablename,');
    console.log('     policyname,');
    console.log('     permissive,');
    console.log('     roles,');
    console.log('     cmd,');
    console.log('     qual');
    console.log('   FROM pg_policies');
    console.log('   WHERE tablename = \'attendees\';');
    console.log('');
    console.log('   Si no hay políticas, ejecuta el script fix-rls-policies.sql');

    // 6. Recomendaciones finales
    console.log('\n📋 RECOMENDACIONES FINALES:');
    console.log('   1. Ejecuta el script fix-rls-policies.sql en el SQL Editor de Supabase');
    console.log('   2. Verifica que las políticas se crearon correctamente');
    console.log('   3. Prueba el escáner QR con el rol editor');
    console.log('   4. Si aún no funciona, usa la política alternativa más simple');

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la verificación
checkAndFixProfiles(); 