// Script simple para reenviar correo a un email específico
// Uso: node scripts/resend-single-email.js xolomayor1@hotmail.com

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const targetEmail = process.argv[2];
  
  if (!targetEmail) {
    console.error('❌ Debes especificar un email como argumento.');
    console.log('Uso: node scripts/resend-single-email.js email@ejemplo.com');
    process.exit(1);
  }

  console.log(`🔍 Buscando asistente con email: ${targetEmail}`);
  
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('email', targetEmail);

  if (error) {
    console.error('❌ Error al buscar asistentes:', error);
    process.exit(1);
  }

  if (attendees.length === 0) {
    console.log(`❌ No se encontró ningún asistente con el email: ${targetEmail}`);
    return;
  }

  const attendee = attendees[0];
  console.log(`✅ Asistente encontrado: ${attendee.firstname} ${attendee.lastname}`);
  
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

  console.log('📧 Enviando correo de confirmación...');

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
      console.error(`❌ Error al reenviar:`, result.error || result);
    }
  } catch (err) {
    console.error(`❌ Error de red:`, err);
  }
}

main(); 