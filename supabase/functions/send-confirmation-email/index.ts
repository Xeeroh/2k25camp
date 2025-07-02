import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailData {
  firstName: string
  lastName: string
  email: string
  church: string
  sector: string
  paymentAmount: number
  qrData: string
  receivesTshirt?: boolean
  tshirtSize?: string
  isResend?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json() as EmailData;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(body.qrData)}`;
    const fromEmail = 'MDP Noroeste <noreply@mdpnoroeste.com>';

    const tshirtMessage = body.receivesTshirt 
      ? `
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin-top: 0;">¡FELICITACIONES! 🎉</h3>
          <p style="margin-bottom: 0;">Por ser uno de los primeros 100 registrados, <strong>has ganado una camiseta exclusiva talla ${body.tshirtSize || 'seleccionada'}</strong>. ¡No olvides recogerla durante el evento!</p>
        </div>
      ` 
      : '';

    const subject = body.isResend
      ? '🔁 Reenvío de Confirmación - Nuevo QR para tu registro al MDP Noroeste'
      : '✅ Confirmación de Registro - MDP Noroeste';

    const headerTitle = body.isResend 
      ? '🔁 Nuevo Código QR Generado'
      : '✅ ¡Registro Completado!';

    const introMessage = body.isResend
      ? 'Te enviamos nuevamente tu correo de confirmación con un nuevo código QR actualizado para tu ingreso al Campamento Alfa y Omega.'
      : 'Gracias por registrarte al Campamento Alfa y Omega Distrito Noroeste. Tu registro ha sido procesado exitosamente.';

    const resendNote = body.isResend 
      ? `<p style="color: #ef4444; font-size: 14px; margin-top: 10px;"><strong>Nota:</strong> Este QR reemplaza al anterior. Por favor, usa este nuevo código para ingresar al evento.</p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">${headerTitle}</h1>

        <p style="text-align: center; margin-bottom: 20px;">Hola ${body.firstName},</p>

        <p style="text-align: center; margin-bottom: 20px;">${introMessage}</p>

        ${resendNote}

        ${tshirtMessage}

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #2563eb; margin-bottom: 15px;">Detalles del Registro:</h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: inline-block; text-align: left;">
            <li style="margin-bottom: 8px;"><strong>Nombre:</strong> ${body.firstName} ${body.lastName}</li>
            <li style="margin-bottom: 8px;"><strong>Iglesia:</strong> ${body.church}</li>
            <li style="margin-bottom: 8px;"><strong>Sector:</strong> ${body.sector}</li>
            ${body.receivesTshirt && body.tshirtSize ? `<li style="margin-bottom: 8px;"><strong>Talla de Camiseta:</strong> ${body.tshirtSize}</li>` : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Tu Código QR de Acceso</h3>
          <div style="background-color: white; padding: 15px; border-radius: 8px; display: inline-block; margin: 0 auto;">
            <img src="${qrImageUrl}" alt="Código QR" style="max-width: 200px; margin: 0 auto; display: block;" />
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">Presenta este código QR al ingresar al evento</p>
        </div>

        <p style="text-align: center; margin-bottom: 20px;">Si tienes alguna pregunta, no dudes en contactarnos.</p>

        <p style="margin-top: 30px; text-align: center;">
          Saludos,<br>
          <strong>Equipo MDP Noroeste</strong>
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: body.email,
      subject,
      html
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Correo enviado correctamente',
        details: { 
          id: emailResponse.id,
          to: body.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        code: 'GENERAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
