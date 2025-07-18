"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { isMobile } from 'react-device-detect';

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 }
};

 interface QrScannerProps {
   onScan: (data: string) => void;
}

 type CameraDevice = {
   id: string;
   label: string;
 }

const qrScannerId = 'reader';
const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function QrScanner({ onScan }: QrScannerProps) {
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      setAvailableCameras(devices);
      if (!isIPhone && devices.length > 0) {
        setSelectedCamera(devices[0].id);
      } else {
        setSelectedCamera('back'); // default en iPhone
      }
    });
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/beep.mp3');
      audioRef.current.preload = 'auto';
    }
    return () => {
      stopScanner();
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
        audioRef.current.play().catch(() => {});
      } catch {}
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      await qrScannerRef.current.stop();
      await qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    try {
      if (qrScannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(qrScannerId);
      qrScannerRef.current = html5QrCode;

      const config = {
        ...SCANNER_CONFIG,
        qrbox: isMobile ? { width: 250, height: 250 } : SCANNER_CONFIG.qrbox,
        fps: 10
      };

      const cameraConfig = isIPhone
        ? { facingMode: selectedCamera === 'front' ? 'user' : 'environment' }
        : { deviceId: { exact: selectedCamera } };

      await html5QrCode.start(
        cameraConfig,
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
        () => { }
      );

      setScanning(true);
      toast.info('Escáner activado. Apunte a un código QR.');
    } catch (err) {
      toast.error('No se pudo acceder a la cámara. Verifique los permisos.');
      setScanning(false);
    }
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

      <div id={qrScannerId} className="mt-4 rounded-md overflow-hidden border border-gray-300" />

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {isIPhone ? (
          <Select
            value={selectedCamera}
            onValueChange={setSelectedCamera}
            disabled={scanning}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Cámara frontal</SelectItem>
              <SelectItem value="back">Cámara trasera</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          availableCameras.length > 0 && (
            <Select
              value={selectedCamera}
              onValueChange={setSelectedCamera}
              disabled={scanning}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Seleccionar cámara" />
              </SelectTrigger>
              <SelectContent>
                {availableCameras.map(camera => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.label || `Cámara ${camera.id.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

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
          onClick={stopScanner}
          disabled={!scanning}
          className="bg-blue-900 w-full sm:w-auto"
        >
          Detener
        </Button>
      </div>
    </div>
  );
}


export default memo(QrScanner);
