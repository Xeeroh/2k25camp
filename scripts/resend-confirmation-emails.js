// Script para reenviar correos de confirmación con QR a todos los registros
// Ejecutar: node scripts/resend-confirmation-emails.js

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
  console.log('Obteniendo todos los registros de asistentes...');
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('*');

  if (error) {
    console.error('Error al obtener asistentes:', error);
    process.exit(1);
  }

  console.log(`Total de asistentes encontrados: ${attendees.length}`);

  // Eliminar el filtro, procesar todos los asistentes
   const filteredAttendees = attendees.filter(a => a.email === 'elrico2345@gmail.com');
   console.log(`Total de asistentes para prueba: ${filteredAttendees.length}`);

  //for (const attendee of attendees) {
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
        isResend: true // ✅ NUEVO
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
        console.log(`Correo reenviado a: ${attendee.email}`);
      } else {
        console.error(`Error al reenviar a ${attendee.email}:`, result.error || result);
      }
    } catch (err) {
      console.error(`Error de red al reenviar a ${attendee.email}:`, err);
    }
    // Esperar 2 segundos entre envíos
    await sleep(2000);
  }

  console.log('Proceso de reenvío completado.');
}

main(); 