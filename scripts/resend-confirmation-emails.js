// Script para reenviar correos de confirmación con QR
// Uso: 
//   node scripts/resend-confirmation-emails.js                    (reenviar a todos)
//   node scripts/resend-confirmation-emails.js xolomayor1@hotmail.com  (reenviar a email específico)

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Obtener el email específico de los argumentos de línea de comandos
  const targetEmail = process.argv[2];
  const isResendAll = !targetEmail;
  
  console.log('Obteniendo todos los registros de asistentes...');
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('*');

  if (error) {
    console.error('Error al obtener asistentes:', error);
    process.exit(1);
  }

  console.log(`Total de asistentes encontrados: ${attendees.length}`);

  // Filtrar asistentes según el parámetro
  let filteredAttendees;
  if (isResendAll) {
    filteredAttendees = attendees;
    console.log(`Reenviando a TODOS los asistentes: ${filteredAttendees.length}`);
  } else {
    filteredAttendees = attendees.filter(a => a.email === targetEmail);
    console.log(`Reenviando a email específico: ${targetEmail}`);
    console.log(`Total de asistentes encontrados con este email: ${filteredAttendees.length}`);
  }

  if (filteredAttendees.length === 0) {
    if (isResendAll) {
      console.log('No hay asistentes para reenviar.');
    } else {
      console.log(`No se encontró ningún asistente con el email: ${targetEmail}`);
    }
    return;
  }

  console.log('\n=== INICIANDO REENVÍO DE CORREOS ===');
  
  for (const attendee of filteredAttendees) {
    console.log(`\nProcesando: ${attendee.email} (${attendee.firstname} ${attendee.lastname})`);
    
    const qrData = `id:${attendee.id}`;
    const payload = {
        firstName: attendee.firstname,
        lastName: attendee.lastname,
        email: attendee.email,
        church: attendee.church,
        sector: attendee.sector,
        qrData,
        receivesTshirt: attendee.receives_tshirt,
        tshirtSize: attendee.tshirtsize,
        isResend: true
      };
      

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        console.log(`✅ Correo reenviado exitosamente a: ${attendee.email}`);
      } else {
        console.error(`❌ Error al reenviar a ${attendee.email}:`, result.error || result);
      }
    } catch (err) {
      console.error(`❌ Error de red al reenviar a ${attendee.email}:`, err);
    }
    
    // Esperar 2 segundos entre envíos para no sobrecargar el servidor
    if (filteredAttendees.length > 1) {
      console.log('⏳ Esperando 2 segundos antes del siguiente envío...');
      await sleep(2000);
    }
  }

  console.log('\n=== PROCESO DE REENVÍO COMPLETADO ===');
  console.log(`Total de correos procesados: ${filteredAttendees.length}`);
}

main(); 