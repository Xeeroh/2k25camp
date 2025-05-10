"use client";

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function QRTest() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [qrValue, setQrValue] = useState<string>('');

  useEffect(() => {
    fetchAttendees();
  }, []);

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('registrationdate', { ascending: false });

      if (error) throw error;

      setAttendees(data || []);
      if (data && data.length > 0) {
        setSelectedAttendee(data[0]);
      }
    } catch (error) {
      console.error('Error al obtener asistentes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedAttendee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4">No hay asistentes registrados</h2>
          <p className="text-muted-foreground">Registra un asistente para generar un QR</p>
        </div>
      </div>
    );
  }

  const generateQr = (selectedAttendee: any) => {
    const qrData = {
      id: selectedAttendee.id,
      nombre: `${selectedAttendee.firstname} ${selectedAttendee.lastname}`,
      email: selectedAttendee.email,
      iglesia: selectedAttendee.church,
      sector: selectedAttendee.sector,
      monto: selectedAttendee.paymentamount,
      estado: selectedAttendee.paymentstatus,
      fecha: selectedAttendee.registrationdate
    };
    setQrValue(JSON.stringify(qrData));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Prueba de Generación de QR</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Seleccionar Asistente:</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedAttendee.id}
            onChange={(e) => {
              const attendee = attendees.find(a => a.id === e.target.value);
              setSelectedAttendee(attendee);
            }}
          >
            {attendees.map((attendee) => (
              <option key={attendee.id} value={attendee.id}>
                {attendee.firstName} {attendee.lastName} - {attendee.church}
              </option>
            ))}
          </select>
        </div>
        
        <div className="bg-white p-4 rounded-lg mb-6 flex justify-center">
          <QRCodeSVG 
            value={qrValue}
            size={200}
            level="H"
            includeMargin={true}
            style={{ width: '200px', height: '200px' }}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Datos del QR:</label>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {qrValue}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={fetchAttendees}
              variant="outline"
              className="w-full"
            >
              Actualizar Lista
            </Button>
            
            <Button 
              onClick={() => {
                const svg = document.querySelector('svg');
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
                      link.download = `qr-${qrValue.split(',')[1].replace(/\s+/g, '-')}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    }
                  };
                  
                  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                }
              }}
              className="w-full"
            >
              Descargar QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 