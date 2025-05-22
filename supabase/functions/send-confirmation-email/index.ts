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
  receivesTshirt?: boolean // Si recibe camiseta (primeros 100)
  tshirtSize?: string // Talla de camiseta seleccionada
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
      qrDataLength: body.qrData ? body.qrData.length : 0,
      receivesTshirt: body.receivesTshirt,
      tshirtSize: body.tshirtSize
    }));

    // Usar un servicio externo para generar el QR
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(body.qrData)}`;
    console.log('URL de QR generada');

    // Usar una dirección de correo verificada en resend.com
    // Para usar este dominio, debe estar verificado en Resend
    const fromEmail = 'MDP Noroeste <noreply@mdpnoroeste.com>';
    console.log('Enviando correo desde:', fromEmail, 'a:', body.email);

    // Preparar el mensaje de camiseta para los primeros 100 registros
    const tshirtMessage = body.receivesTshirt 
      ? `
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin-top: 0;">¡FELICITACIONES! 🎉</h3>
          <p style="margin-bottom: 0;">Por ser uno de los primeros 100 registrados, <strong>has ganado una camiseta exclusiva talla ${body.tshirtSize || 'seleccionada'}</strong>. ¡No olvides recogerla durante el evento!</p>
        </div>
      ` 
      : '';

    // Enviar correo de confirmación con el QR
    try {
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: body.email,
        subject: 'Confirmación de Registro - MDP Noroeste',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">¡Registro Completado!</h1>
            
            <p style="text-align: center; margin-bottom: 20px;">Hola ${body.firstName},</p>
            
            <p style="text-align: center; margin-bottom: 20px;">Gracias por registrarte al Campamento Alfa y Omega Distrito Noroeste. Tu registro ha sido procesado exitosamente.</p>
            
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