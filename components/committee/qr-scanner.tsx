"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QrScannerProps {
  onScan: (data: string) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

// Configuración mejorada para el escáner
const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 300, height: 300 },
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
  },
  formatsToSupport: [0],
  disableFlip: false,
  aspectRatio: 1.0,
  showZoomSliderIfSupported: true,
  videoConstraints: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
    focusMode: "continuous",
    exposureMode: "continuous"
  }
};

function QrScanner({ onScan }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const qrScannerId = "qr-reader-id";
  
  // Mejorar la detección de dispositivos móviles
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobile = (isMobileDevice && isSmallScreen) || (isMobileDevice && hasTouchScreen) || (isSmallScreen && hasTouchScreen);
      
      setIsMobile(isMobile);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
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
  
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Cámara ${device.deviceId.slice(0, 5)}`
        }));
      setAvailableCameras(videoDevices);
      
      // Seleccionar la cámara trasera por defecto en dispositivos móviles
      if (isMobile && videoDevices.length > 1) {
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('trasera')
        );
        if (backCamera) {
          setSelectedCamera(backCamera.deviceId);
        } else {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      toast.error('Error al obtener la lista de cámaras');
    }
  };

  useEffect(() => {
    getAvailableCameras();
  }, [isMobile]);
  
  const startScanner = async () => {
    try {
      if (qrScannerRef.current) {
        await stopScanner();
      }

      if (!selectedCamera) {
        toast.error('No hay cámara seleccionada');
        return;
      }

      const html5QrCode = new Html5Qrcode(qrScannerId);
      qrScannerRef.current = html5QrCode;

      const config = {
        ...SCANNER_CONFIG,
        qrbox: isMobile ? { width: 250, height: 250 } : SCANNER_CONFIG.qrbox,
        fps: 10
      };

      await html5QrCode.start(
        { deviceId: selectedCamera },
        config,
        async (decodedText) => {
          playSuccessSound();
          setScanAttempts(prev => prev + 1);

          try {
            await stopScanner();
            let cleanedQrData = decodedText.trim();

            if (cleanedQrData.startsWith('{') && !cleanedQrData.endsWith('}')) {
              const lastBraceIndex = cleanedQrData.lastIndexOf('}');
              if (lastBraceIndex > 0) {
                cleanedQrData = cleanedQrData.substring(0, lastBraceIndex + 1);
              }
            }

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
      <div className={`relative ${scanning ? 'w-full h-[70vh] md:h-[60vh]' : 'aspect-video'} max-w-4xl mx-auto bg-black/5 rounded-lg overflow-hidden`}>
        <div id={qrScannerId} className="absolute inset-0 w-full h-full"></div>

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
        {availableCameras.length > 1 && (
          <Select
            value={selectedCamera}
            onValueChange={setSelectedCamera}
            disabled={scanning}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              {availableCameras.map((camera) => (
                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                  {camera.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button
          onClick={startScanner}
          className="flex items-center gap-2 w-full sm:w-auto"
          disabled={scanning || !selectedCamera}
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
          <p className="text-xs mt-1">Asegúrese de que el código QR esté bien iluminado y en foco</p>
          <p className="text-xs mt-1">Mantenga una distancia de aproximadamente 15-20 cm</p>
        </div>
      )}
    </div>
  );
}

// Usar React.memo para evitar re-renderizados innecesarios
export default memo(QrScanner); 