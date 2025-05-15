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
  fps: 10, // Reducido de 10 a 8 para menos consumo de recursos
  qrbox: { width: 250, height: 250 },
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true // Usar la API nativa si está disponible
  },
  formatsToSupport: [0], // Solo QR codes (0 = QR_CODE)
  disableFlip: true // Mejor rendimiento sin flip
};

function QrScanner({ onScan }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const qrScannerId = "qr-reader-id";
  
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
      <div className="relative aspect-square w-full max-w-md mx-auto bg-black/5 rounded-lg overflow-hidden">
        <div id={qrScannerId} className="w-full h-full"></div>
        
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Camera className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Presione el botón para iniciar el escáner</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={startScanner}
          className="flex items-center gap-2"
          disabled={scanning}
        >
          <Camera className="h-4 w-4" />
          Iniciar Escáner
        </Button>
        
        <Button
          variant="outline"
          onClick={() => stopScanner()}
          disabled={!scanning}
        >
          Detener
        </Button>
      </div>
    </div>
  );
}

// Usar React.memo para evitar re-renderizados innecesarios
export default memo(QrScanner); 