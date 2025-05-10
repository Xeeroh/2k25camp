// Script para probar la conexión a Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Verificar variables de entorno
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definido' : 'No definido');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definido' : 'No definido');

// Crear cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
  try {
    // Probar conexión básica
    console.log('Probando conexión a Supabase...');
    const { count, error: countError } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log('Conexión exitosa. Total de registros:', count);
    
    // Obtener todos los asistentes
    console.log('\nConsultando primeros 5 asistentes:');
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .limit(5);
    
    if (attendeesError) {
      throw attendeesError;
    }
    
    console.log('Asistentes encontrados:', attendees.length);
    attendees.forEach((attendee, index) => {
      console.log(`\nAsistente #${index + 1}:`, {
        id: attendee.id,
        firstname: attendee.firstname,
        lastname: attendee.lastname,
        email: attendee.email,
        paymentstatus: attendee.paymentstatus
      });
    });
    
    // Consultar un asistente específico si hay al menos uno
    if (attendees.length > 0) {
      const testId = attendees[0].id;
      console.log(`\nConsultando asistente con ID: ${testId}`);
      
      const { data: singleAttendee, error: singleError } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', testId)
        .single();
      
      if (singleError) {
        throw singleError;
      }
      
      console.log('Asistente encontrado:', {
        id: singleAttendee.id,
        nombre: `${singleAttendee.firstname} ${singleAttendee.lastname}`,
        email: singleAttendee.email,
        church: singleAttendee.church,
        sector: singleAttendee.sector,
        paymentamount: singleAttendee.paymentamount,
        paymentstatus: singleAttendee.paymentstatus
      });
    }
  } catch (error) {
    console.error('Error en la prueba de Supabase:', error);
  }
}

testSupabaseConnection(); 