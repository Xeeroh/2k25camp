const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obtener credenciales desde las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno necesarias no encontradas.');
  console.error('Asegúrate de tener configurado NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY en tu archivo .env');
  process.exit(1);
}

// Crear cliente con clave de servicio para operaciones privilegiadas
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateDatabase() {
  try {
    console.log('Iniciando migración de la base de datos...');

    // Verificar que la tabla exista
    const { data: tableData, error: tableError } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    if (tableError) {
      console.error('Error al verificar la tabla:', tableError);
      return;
    }

    console.log('Tabla encontrada. Añadiendo columnas nuevas...');

    // === INSTRUCCIONES PARA MIGRACIÓN MANUAL EN SUPABASE ===
    console.log('\n==== PASOS PARA MIGRACIÓN MANUAL ====');
    console.log('1. Ve al dashboard de Supabase y navega a la sección SQL Editor');
    console.log('2. Crea un nuevo script SQL y copia el siguiente código:');
    console.log(`
/* Añadir campo para talla de camiseta */
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS tshirtsize TEXT;

/* Añadir campo para marcar registros de prueba */
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS istest BOOLEAN DEFAULT FALSE;

/* Comentario para la columna tshirtsize */
COMMENT ON COLUMN attendees.tshirtsize IS 'Talla de camiseta para los primeros 100 asistentes';

/* Comentario para la columna istest */
COMMENT ON COLUMN attendees.istest IS 'Indica si es un registro de prueba (no cuenta para camisetas)';
    `);
    console.log('3. Ejecuta el script SQL');
    console.log('4. Verifica que las columnas se hayan añadido correctamente');
    
    // Si tienes clave de servicio con permisos para ejecutar SQL directamente:
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE attendees 
          ADD COLUMN IF NOT EXISTS tshirtsize TEXT;
          
          ALTER TABLE attendees 
          ADD COLUMN IF NOT EXISTS istest BOOLEAN DEFAULT FALSE;
          
          COMMENT ON COLUMN attendees.tshirtsize IS 'Talla de camiseta para los primeros 100 asistentes';
          
          COMMENT ON COLUMN attendees.istest IS 'Indica si es un registro de prueba (no cuenta para camisetas)';
        `
      });
      
      if (error) {
        console.error('Error al ejecutar la migración automática:', error);
        console.log('Por favor, sigue las instrucciones para la migración manual.');
      } else {
        console.log('¡Migración completada automáticamente!');
      }
    } catch (err) {
      console.error('Error al intentar migración automática:', err);
      console.log('Por favor, sigue las instrucciones para la migración manual.');
    }

  } catch (error) {
    console.error('Error general en la migración:', error);
  }
}

migrateDatabase()
  .then(() => {
    console.log('Proceso de migración finalizado.');
  })
  .catch((err) => {
    console.error('Error en proceso de migración:', err);
  }); 