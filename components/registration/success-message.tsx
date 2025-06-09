"use client";

import { useRef, useEffect } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface SuccessMessageProps {
  qrData: string;
  onReset: () => void;
}

export const SuccessMessage = ({ qrData, onReset }: SuccessMessageProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Agregar logs para depuración
  useEffect(() => {
    console.log('SuccessMessage - QR Data recibido:', qrData);
    try {
      if (qrData) {
        const parsedData = JSON.parse(qrData);
        console.log('SuccessMessage - Datos parseados:', parsedData);
      } else {
        console.log('SuccessMessage - No hay datos de QR');
      }
    } catch (error) {
      console.error('SuccessMessage - Error al parsear qrData:', error);
    }
  }, [qrData]);
  
  const handleDownloadQR = () => {
    console.log('Iniciando descarga del QR');
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            try {
              const qrDataObj = JSON.parse(qrData);
              const fileName = qrDataObj.nombre || 'asistente';
              link.download = `qr-${fileName.replace(/\s+/g, '-')}.png`;
            } catch (e) {
              link.download = `qr-asistente.png`;
            }
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  if (!qrData) {
    console.warn('No hay datos de QR disponibles para mostrar');
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">
          No se pudieron generar los datos del registro. Por favor, intente nuevamente.
        </p>
        <Button onClick={() => handleNavigation('/registro')}>
          Volver al formulario
        </Button>
      </div>
    );
  }

  let attendeeName = '';
  let attendeeEmail = '';
  
  try {
    const data = JSON.parse(qrData);
    console.log('Mostrando datos del QR:', data);
    
    // Extraer los datos relevantes
    attendeeName = data.nombre || '';
    attendeeEmail = data.email || '';
    
    if (!attendeeEmail) {
      console.warn('No se encontró email en los datos del QR');
    }
  } catch (error) {
    console.error('Error al procesar los datos para el QR:', error);
    // Continuar con el render pero con datos vacíos
  }
  
  return (
    <div className="card-glass p-8 rounded-lg shadow-sm border border-border text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-300" />
      </div>
      
      <h2 className="text-2xl font-bold mb-4">¡Registro Completado!</h2>
      
      <p className="text-muted-foreground mb-6">
        Gracias por registrarse al Campamento Alfa y Omega . Su registro ha sido procesado exitosamente.
        <br /><br />
        {attendeeEmail ? (
          <strong>Hemos enviado un correo a: {attendeeEmail}</strong>
        ) : (
          <strong>
            Hemos enviado un correo de confirmación a su dirección de correo registrada.
             Si no lo encuentra en su bandeja de entrada, por favor revise su carpeta de spam o correo no deseado.
          </strong>
        )}
      </p>
      
      <div className="card-glass border border-border rounded-lg p-6 mb-6 bg-muted/30">
        <h3 className="font-semibold mb-4">Su Código QR de Acceso</h3>
        
        <div className="flex justify-center mb-4" ref={qrRef}>
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
              style={{ width: '200px', height: '200px' }}
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Presente este código QR al ingresar al evento. Guárdelo o descárguelo para su uso posterior.
        </p>
        
        <Button
          onClick={handleDownloadQR}
          variant="outline"
          className="mb-4 bg-blue-900"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar Código QR
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => handleNavigation('/')} variant="outline" className='bg-blue-900'>
          Volver al Inicio
        </Button>
        
        <Button onClick={onReset} variant="outline" className='bg-blue-900'>
          Registrar Otro Asistente
        </Button>
      </div>
    </div>
  );
}