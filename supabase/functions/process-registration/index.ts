import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { QRCode } from "qrcode";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Manejar solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Parsear el cuerpo de la solicitud
    const body = await req.json()

    const { data, error } = await supabaseClient
      .from('attendees')
      .insert([
        {
          firstname: body.firstName,
          lastname: body.lastName,
          email: body.email,
          phone: body.phone,
          church: body.church,
          sector: body.sector,
          paymentamount: body.paymentAmount,
          paymentstatus: 'Pendiente',
          registrationdate: new Date().toISOString(),
          paymentreceipturl: body.paymentReceiptUrl
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Generar datos para el QR
    const qrData = {
      id: data.id,
      nombre: `${body.firstName} ${body.lastName}`,
      email: body.email,
      iglesia: body.church,
      sector: body.sector,
      monto: body.paymentAmount,
      estado: 'Pendiente',
      fecha: new Date().toISOString()
    }

    // Generar el QR como base64
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        qrCode,
        emailData: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          church: body.church,
          sector: body.sector,
          paymentAmount: body.paymentAmount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 