"use client";

import { useRef } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface SuccessMessageProps {
  qrData: string | null;
  onReset: () => void;
}

export const SuccessMessage = ({ qrData, onReset }: SuccessMessageProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadQR = () => {
    console.log('Iniciando descarga del QR');
    if (!qrData) {
      console.warn('No hay datos de QR para descargar');
      return;
    }
    
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

  let attendeeId = '';
  if (qrData && qrData.startsWith('id:')) {
    attendeeId = qrData.replace('id:', '');
  }
  
  return (
    <div className="card-glass p-10 overflow-hidden animate-fade-in text-center max-w-2xl mx-auto border-white/5 shadow-2xl relative">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />

      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-900/40">
        <CheckCircle2 className="h-12 w-12 text-white -rotate-12" />
      </div>
      
      <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">¡REGISTRO EXITOSO!</h2>
      
      <p className="text-muted-foreground mb-6">
        Gracias por registrarse al Campamento Alfa y Omega. Su registro ha sido procesado exitosamente.<br /><br />
        <strong>
          Hemos enviado un correo de confirmación a su dirección de correo registrada. Si no lo encuentra en su bandeja de entrada, por favor revise su carpeta de spam o correo no deseado.
        </strong>
      </p>
      
      <div className="card-glass border-white/10 p-8 mb-8 backdrop-blur-xl bg-white/5">
        <h3 className="text-xl font-bold mb-6 text-blue-100">TU ACCESO QR</h3>
        
        <div className="flex justify-center mb-6" ref={qrRef}>
          <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-black/50">
            {qrData && (
              <QRCodeSVG 
                value={qrData}
                size={220}
                level="H"
                includeMargin={false}
                style={{ width: '220px', height: '220px' }}
              />
            )}
          </div>
        </div>
        
        <p className="text-blue-100/60 mb-6 text-sm">
          Presente este código al ingresar al evento.<br />
          <span className="font-bold text-blue-100">ID: {attendeeId}</span>
        </p>
        
        <Button
          onClick={handleDownloadQR}
          variant="tangelo"
          className="mb-4 px-8 h-12 rounded-full"
        >
          <Download className="mr-2 h-5 w-5" />
          Descargar Pase QR
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => handleNavigation('/')} variant="ghost" className="text-white hover:bg-white/10">
          Volver al Inicio
        </Button>
        
        <Button onClick={onReset} variant="outline" className="border-white/20 text-white">
          Registrar Otro Asistente
        </Button>
      </div>
    </div>
  );
}