const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obtener credenciales desde las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  // Usamos la clave anónima para este caso

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno necesarias no encontradas.');
  console.error('Asegúrate de tener configurado NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env');
  process.exit(1);
}

// Crear cliente con clave anónima (suficiente para consultas)
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    console.log('Verificando estructura de la tabla attendees...');

    // Listar todas las columnas de la tabla attendees
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error al consultar la tabla:', error);
      return;
    }

    if (data && data.length > 0) {
      const sampleRow = data[0];
      console.log('Columnas en la tabla attendees:');
      
      // Mostrar todas las columnas disponibles
      const columns = Object.keys(sampleRow);
      columns.forEach(column => {
        console.log(`- ${column}: ${typeof sampleRow[column]}`);
      });
      
      // Verificar si existe la columna tshirtsize
      if (columns.includes('tshirtsize')) {
        console.log('\n✅ La columna "tshirtsize" existe en la tabla.');
        console.log(`   Tipo: ${typeof sampleRow.tshirtsize}`);
        console.log(`   Valor de muestra: ${sampleRow.tshirtsize || 'NULL'}`);
      } else {
        console.log('\n❌ La columna "tshirtsize" NO existe en la tabla.');
        console.log('   Debes ejecutar la migración para añadir esta columna.');
      }
      
      // Verificar si existe la columna istest
      if (columns.includes('istest')) {
        console.log('\n✅ La columna "istest" existe en la tabla.');
        console.log(`   Tipo: ${typeof sampleRow.istest}`);
        console.log(`   Valor de muestra: ${sampleRow.istest}`);
      } else {
        console.log('\n❌ La columna "istest" NO existe en la tabla.');
        console.log('   Debes ejecutar la migración para añadir esta columna.');
      }
    } else {
      console.log('No hay registros en la tabla para analizar la estructura.');
      
      // Intentar determinar si las columnas existen mediante una consulta específica
      const { data: insertData, error: insertError } = await supabase
        .from('attendees')
        .insert([
          {
            firstname: 'Test',
            lastname: 'Column',
            email: 'test@example.com',
            church: 'Test Church',
            sector: 'Test Sector',
            paymentamount: 0,
            paymentstatus: 'Pendiente',
            registrationdate: new Date().toISOString(),
            tshirtsize: 'M',
            istest: true
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Error al intentar probar la estructura:', insertError);
        
        if (insertError.message.includes('tshirtsize')) {
          console.log('\n❌ La columna "tshirtsize" parece no existir en la tabla.');
        }
        
        if (insertError.message.includes('istest')) {
          console.log('\n❌ La columna "istest" parece no existir en la tabla.');
        }
      } else {
        console.log('\n✅ Las columnas tshirtsize e istest parecen existir, se ha creado un registro de prueba.');
        console.log('   Recuerda eliminar este registro de prueba.');
      }
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkColumns()
  .then(() => {
    console.log('\nVerificación completada.');
  })
  .catch((err) => {
    console.error('Error en el proceso de verificación:', err);
  }); 