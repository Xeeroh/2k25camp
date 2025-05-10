"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ManualIdInputProps {
  onScanSimulation: (qrText: string) => void;
}

export default function ManualIdInput({ onScanSimulation }: ManualIdInputProps) {
  const [manualId, setManualId] = useState('');
  const [qrJson, setQrJson] = useState('');
  const [useJsonFormat, setUseJsonFormat] = useState(true);

  const handleSimulateScan = () => {
    if (!manualId && !qrJson) {
      toast.error('Por favor ingresa un ID o datos JSON');
      return;
    }

    if (useJsonFormat) {
      try {
        // Validar que es un JSON válido si está usando formato JSON
        if (qrJson) {
          JSON.parse(qrJson);
        }
        onScanSimulation(qrJson);
        toast.success('Simulando escaneo con datos JSON');
      } catch (error) {
        toast.error('El JSON ingresado no es válido');
      }
    } else {
      onScanSimulation(manualId);
      toast.success('Simulando escaneo con ID directo');
    }
  };

  const generateSampleJson = () => {
    if (!manualId) {
      toast.error('Ingresa un ID para generar el JSON de muestra');
      return;
    }

    const sampleJson = JSON.stringify({
      id: manualId,
      nombre: "Asistente Prueba",
      email: "prueba@example.com",
      iglesia: "Iglesia de Prueba",
      sector: "Sector 1",
      monto: 100,
      estado: "Pendiente",
      fecha: new Date().toISOString()
    }, null, 2);

    setQrJson(sampleJson);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Prueba Manual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="ID de asistente"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="text-xs"
          />
          <Button size="sm" variant="outline" onClick={generateSampleJson}>
            Generar JSON
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              id="use-json"
              checked={useJsonFormat}
              onChange={() => setUseJsonFormat(!useJsonFormat)}
              className="rounded border-gray-300"
            />
            <label htmlFor="use-json">Usar formato JSON</label>
          </div>

          {useJsonFormat && (
            <textarea
              placeholder="Datos JSON del QR"
              value={qrJson}
              onChange={(e) => setQrJson(e.target.value)}
              className="w-full h-24 text-xs p-2 border rounded"
            />
          )}
        </div>

        <Button onClick={handleSimulateScan} size="sm" className="w-full">
          Simular Escaneo
        </Button>
      </CardContent>
    </Card>
  );
} 