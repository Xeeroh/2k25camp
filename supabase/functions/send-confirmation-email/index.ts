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
  qrData: string // Datos JSON del QR
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
    // Obtener la API key de Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY no está configurada');
      throw new Error('Error de configuración de Resend');
    }
    
    console.log('Inicializando cliente Resend');
    const resend = new Resend(resendApiKey);
    
    // Obtener el cuerpo de la solicitud
    const body = await req.json() as EmailData;
    console.log('Datos recibidos:', JSON.stringify({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      church: body.church,
      sector: body.sector,
      paymentAmount: body.paymentAmount,
      qrDataLength: body.qrData ? body.qrData.length : 0
    }));

    // Usar un servicio externo para generar el QR
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(body.qrData)}`;
    console.log('URL de QR generada');

    // Usar una dirección de correo verificada en resend.com
    // Para usar este dominio, debe estar verificado en Resend
    const fromEmail = 'MDP Noroeste <noreply@mdpnoroeste.com>';
    console.log('Enviando correo desde:', fromEmail, 'a:', body.email);

    // Enviar correo de confirmación con el QR
    try {
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: body.email,
        subject: 'Confirmación de Registro - MDP Noroeste',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; text-align: center;">¡Registro Completado!</h1>
            
            <p>Hola ${body.firstName},</p>
            
            <p>Gracias por registrarte al evento MDP Noroeste. Tu registro ha sido procesado exitosamente.</p>
            
            <h2 style="color: #2563eb;">Detalles del Registro:</h2>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 8px;"><strong>Nombre:</strong> ${body.firstName} ${body.lastName}</li>
              <li style="margin-bottom: 8px;"><strong>Iglesia:</strong> ${body.church}</li>
              <li style="margin-bottom: 8px;"><strong>Sector:</strong> ${body.sector}</li>
              <li style="margin-bottom: 8px;"><strong>Monto Pagado:</strong> $${body.paymentAmount}</li>
              <li style="margin-bottom: 8px;"><strong>Estado del Pago:</strong> Pendiente</li>
            </ul>

            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #2563eb;">Tu Código QR de Acceso</h3>
              <img src="${qrImageUrl}" alt="Código QR" style="max-width: 200px; margin: 20px auto; display: block;" />
              <p style="font-size: 14px; color: #666;">Presenta este código QR al ingresar al evento</p>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              Saludos,<br>
              <strong>Equipo MDP Noroeste</strong>
            </p>
          </div>
        `
      });
      
      console.log('Respuesta de Resend:', JSON.stringify(emailResponse));
      
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
    } catch (sendError) {
      console.error('Error específico al enviar correo:', sendError);
      // Devolver un error más específico relacionado con el envío de correo
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: sendError instanceof Error ? sendError.message : 'Error al enviar el correo',
          code: 'EMAIL_SEND_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }
  } catch (err) {
    // Convertir el error a string para evitar problemas con tipos
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error en la función de envío de correo:', errorMessage);
    
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