"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

interface QrScannerProps {
  onScan: (data: string) => void;
}

// Configuración fija para el escáner
const SCANNER_CONFIG = {
  fps: 5,
  qrbox: { width: 200, height: 200 },
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
  },
  formatsToSupport: [0],
  disableFlip: true,
  aspectRatio: 1.0,
  showZoomSliderIfSupported: true
};

function QrScanner({ onScan }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const qrScannerId = "qr-reader-id";
  
  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile);
    };
    
    checkIfMobile();
  }, []);
  
  useEffect(() => {
    // Precargar el audio solo cuando sea necesario
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/beep.mp3');
      audioRef.current.preload = 'auto';
    }
    
    // Cleanup cuando el componente se desmonta
    return () => {
      stopScanner();
      
      // Limpiar el audio
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);
  
  const playSuccessSound = () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Silenciar errores de reproducción
        });
      } catch (error) {
        // Silenciar errores
      }
    }
  };
  
  const startScanner = async () => {
    try {
      // Verificar si ya hay un escáner en ejecución y detenerlo
      if (qrScannerRef.current) {
        await stopScanner();
      }
      
      // Crear una nueva instancia del escáner
      const html5QrCode = new Html5Qrcode(qrScannerId);
      qrScannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        SCANNER_CONFIG,
        async (decodedText) => {
          // Success callback - QR code detected
          playSuccessSound();
          toast.success('Código QR detectado');
          
          try {
            // Detener el escáner primero para evitar múltiples escaneos
            await stopScanner();
            
            // Limpiar los datos antes de pasarlos al componente padre
            let cleanedQrData = decodedText.trim();
            
            // Caso especial: JSON malformado
            if (cleanedQrData.startsWith('{') && !cleanedQrData.endsWith('}')) {
              const lastBraceIndex = cleanedQrData.lastIndexOf('}');
              if (lastBraceIndex > 0) {
                cleanedQrData = cleanedQrData.substring(0, lastBraceIndex + 1);
              }
            }
            
            // Pasar datos al componente padre
            onScan(cleanedQrData);
          } catch {
            toast.error('Error al procesar el código QR');
          }
        },
        () => {
          // Silenciar errores de escaneo
        }
      );
      
      setScanning(true);
      toast.info('Escáner activado. Apunte a un código QR.');
    } catch (err) {
      toast.error('No se pudo acceder a la cámara. Verifique los permisos.');
      setScanning(false);
    }
  };
  
  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
      } catch {
        // Silenciar errores
      } finally {
        qrScannerRef.current = null;
        setScanning(false);
      }
    }
    setScanning(false);
  };

  return (
    <div className="space-y-4">
      <div className={`relative ${isMobile ? 'aspect-square' : 'aspect-video'} w-full max-w-md mx-auto bg-black/5 rounded-lg overflow-hidden`}>
        <div id={qrScannerId} className="w-full h-full"></div>
        
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Camera className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Presione el botón para iniciar el escáner</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button
          onClick={startScanner}
          className="flex items-center gap-2 w-full sm:w-auto"
          disabled={scanning}
        >
          <Camera className="h-4 w-4" />
          {scanning ? 'Escaneando...' : 'Iniciar Escáner'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => stopScanner()}
          disabled={!scanning}
          className="w-full sm:w-auto"
        >
          Detener
        </Button>
      </div>

      {isMobile && scanning && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          <p>Apunte la cámara al código QR</p>
          <p className="text-xs mt-1">Mantenga el código QR dentro del marco para una mejor lectura</p>
        </div>
      )}
    </div>
  );
}

// Usar React.memo para evitar re-renderizados innecesarios
export default memo(QrScanner); 