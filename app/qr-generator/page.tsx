"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import FooterL from '@/components/shared/footerL';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/admin/login-form';

export default function QRGeneratorPage() {
  const { user, loading, error, hasRole } = useAuth();
  const [manualId, setManualId] = useState('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [qrFormat, setQrFormat] = useState<'json' | 'uuid' | 'idonly'>('json');
  const qrRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchAttendees();
  }, []);
  
  const fetchAttendees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('firstname', { ascending: true });
      
      if (error) throw error;
      
      setAttendees(data || []);
      if (data && data.length > 0) {
        setSelectedAttendee(data[0]);
        generateQR(data[0], qrFormat);
      }
    } catch (error) {
      console.error('Error al cargar asistentes:', error);
      toast.error('Error al cargar asistentes');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateQR = (attendee: any, format: 'json' | 'uuid' | 'idonly') => {
    if (!attendee) return;
    
    let qrContent = '';
    
    switch (format) {
      case 'json':
        // Formato JSON completo
        const qrData = {
          id: attendee.id,
          nombre: `${attendee.firstname} ${attendee.lastname}`,
          email: attendee.email,
          iglesia: attendee.church,
          sector: attendee.sector,
          monto: attendee.paymentamount,
          estado: attendee.paymentstatus,
          fecha: attendee.created_at
        };
        qrContent = JSON.stringify(qrData);
        break;
        
      case 'uuid':
        // Solo UUID con formato específico
        qrContent = `id:${attendee.id}`;
        break;
        
      case 'idonly':
        // Solo el ID sin formato
        qrContent = attendee.id;
        break;
    }
    
    setQrValue(qrContent);
  };
  
  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (svg) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          if (!ctx) return;
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const link = document.createElement('a');
          link.download = `qr-${selectedAttendee ? selectedAttendee.firstname : 'test'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          toast.success('QR descargado');
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      } catch (error) {
        console.error('Error al descargar QR:', error);
        toast.error('Error al descargar QR');
      }
    }
  };
  
  const handleChangeFormat = (format: 'json' | 'uuid' | 'idonly') => {
    setQrFormat(format);
    if (selectedAttendee) {
      generateQR(selectedAttendee, format);
    }
  };
  
  const handleManualIdSubmit = async () => {
    if (!manualId) {
      toast.error('Ingrese un ID');
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', manualId)
        .single();
      
      if (error) {
        toast.error('No se encontró un asistente con ese ID');
        return;
      }
      
      if (data) {
        setSelectedAttendee(data);
        generateQR(data, qrFormat);
        toast.success('Asistente encontrado');
      }
    } catch (error) {
      console.error('Error al buscar ID:', error);
      toast.error('Error al buscar ID');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-try min-h-screen flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-r-transparent rounded-full animate-spin inline-block" />
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
        <FooterL />
      </div>
    );
  }

  if (!user || !hasRole('admin')) {
    return (
      <div className="bg-try min-h-screen flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="card-glass border rounded-lg shadow p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Acceso restringido</h1>
            <p className="mb-4 text-center text-muted-foreground">Solo los administradores pueden acceder a esta página.</p>
            <LoginForm />
          </div>
        </div>
        <FooterL />
      </div>
    );
  }
  
  return (
    <div className="bg-try min-h-screen flex flex-col">
      <Navbar showInternalLinks={true} />
      
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Generador de QR para Pruebas</h1>
          
          <Tabs defaultValue="fromdb" className="mb-8">
            <TabsList>
              <TabsTrigger value="fromdb">Desde Base de Datos</TabsTrigger>
              <TabsTrigger value="manual">ID Manual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fromdb">
              <Card className='card-glass'>
                <CardHeader>
                  <CardTitle className='text-white' >Seleccionar Asistente</CardTitle>
                </CardHeader>
                <CardContent className=" space-y-4">
                  <select 
                    className="w-full p-2 border rounded"
                    disabled={isLoading}
                    onChange={(e) => {
                      const attendee = attendees.find(a => a.id === e.target.value);
                      if (attendee) {
                        setSelectedAttendee(attendee);
                        generateQR(attendee, qrFormat);
                      }
                    }}
                    value={selectedAttendee?.id || ''}
                  >
                    {attendees.map(attendee => (
                      <option key={attendee.id} value={attendee.id}>
                        {attendee.firstname} {attendee.lastname} - {attendee.email}
                      </option>
                    ))}
                  </select>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => fetchAttendees()}
                    disabled={isLoading}
                  >
                    Actualizar Lista
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresar ID Manualmente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="ID del asistente"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                    />
                    <Button onClick={handleManualIdSubmit} disabled={isLoading}>
                      Buscar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {selectedAttendee && (
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Código QR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2 mb-4">
                      <Button 
                        variant={qrFormat === 'json' ? 'default' : 'outline'} 
                        onClick={() => handleChangeFormat('json')}
                        size="sm"
                      >
                        JSON
                      </Button>
                      <Button 
                        variant={qrFormat === 'uuid' ? 'default' : 'outline'} 
                        onClick={() => handleChangeFormat('uuid')}
                        size="sm"
                      >
                        ID con Formato
                      </Button>
                      <Button 
                        variant={qrFormat === 'idonly' ? 'default' : 'outline'} 
                        onClick={() => handleChangeFormat('idonly')}
                        size="sm"
                      >
                        Solo ID
                      </Button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg flex justify-center" ref={qrRef}>
                      <QRCodeSVG
                        value={qrValue}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    
                    <Button onClick={handleDownloadQR} className="w-full">
                      Descargar QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Información del QR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Datos del Asistente</h3>
                      <div className="text-sm mb-4">
                        <p><strong>Nombre:</strong> {selectedAttendee.firstname} {selectedAttendee.lastname}</p>
                        <p><strong>Email:</strong> {selectedAttendee.email}</p>
                        <p><strong>ID:</strong> {selectedAttendee.id}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Contenido del QR</h3>
                      <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap break-all">
                        {qrValue}
                      </pre>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Utiliza este QR para probar el escáner en el panel del comité.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <FooterL />
    </div>
  );
} 