const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obtener credenciales desde las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno necesarias no encontradas.');
  process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTshirtInsert() {
  try {
    console.log('Iniciando prueba de inserción con talla de camiseta...');

    // Crear datos de prueba
    const testData = {
      firstname: 'Prueba',
      lastname: 'Camiseta',
      email: `test.${Date.now()}@example.com`,
      phone: '(123) 456-7890',
      church: 'Iglesia de Prueba',
      sector: 'Sector 1',
      paymentamount: 400,
      paymentstatus: 'Pendiente',
      registrationdate: new Date().toISOString(),
      tshirtsize: 'L',
      istest: true
    };

    console.log('Datos a insertar:', testData);

    // Intentar insertar el registro
    const { data, error } = await supabase
      .from('attendees')
      .insert([testData])
      .select();

    if (error) {
      console.error('Error al insertar registro:', error);
      return;
    }

    console.log('Inserción exitosa:', data);
    console.log('\nVerificando el registro insertado...');

    // Verificar la inserción
    if (data && data.length > 0) {
      const insertedRecord = data[0];
      console.log('Registro creado con ID:', insertedRecord.id);
      console.log('Talla de camiseta guardada:', insertedRecord.tshirtsize);
      
      // Consultar directamente el registro por ID
      const { data: retrievedData, error: retrieveError } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', insertedRecord.id)
        .single();
      
      if (retrieveError) {
        console.error('Error al recuperar el registro:', retrieveError);
        return;
      }
      
      console.log('\nDatos del registro recuperado:');
      console.log('- ID:', retrievedData.id);
      console.log('- Nombre:', retrievedData.firstname, retrievedData.lastname);
      console.log('- Email:', retrievedData.email);
      console.log('- Talla de camiseta:', retrievedData.tshirtsize);
      console.log('- Es prueba:', retrievedData.istest);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

testTshirtInsert()
  .then(() => {
    console.log('\nPrueba completada.');
  })
  .catch((err) => {
    console.error('Error en la prueba:', err);
  }); 