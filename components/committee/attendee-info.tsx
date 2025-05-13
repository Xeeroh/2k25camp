"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, User, Calendar, Building, Mail, CreditCard, QrCode, ShieldCheck, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Interfaz sencilla para los datos del asistente
interface AttendeeData {
  id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  church?: string;
  sector?: string;
  paymentamount?: number;
  paymentstatus?: string;
  created_at?: string;
  tshirtsize?: string;
}

interface AttendeeInfoProps {
  attendee: AttendeeData | null;
  onConfirmAttendance?: (id: string) => void;
}

export default function AttendeeInfo({ attendee, onConfirmAttendance }: AttendeeInfoProps) {
  // Logs para depuración
  useEffect(() => {
    console.log('AttendeeInfo - Datos recibidos:', attendee);
  }, [attendee]);

  // Si no hay datos, mostrar mensaje para escanear QR
  if (!attendee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Asistente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 text-center">
            <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Escanee un código QR para ver la información del asistente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Obtener el estado de pago
  const paymentStatus = attendee.paymentstatus || '';
  const isPaid = paymentStatus.toLowerCase().includes('pagado');
  
  // Formatear nombre completo
  const fullName = [attendee.firstname, attendee.lastname]
    .filter(Boolean)
    .join(' ') || 'No disponible';
  
  // Formatear fecha si existe
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha no disponible';
    }
  };
  
  // Manejar confirmación de asistencia
  const handleConfirm = () => {
    if (onConfirmAttendance && attendee.id) {
      onConfirmAttendance(attendee.id);
    } else {
      toast.success(`Asistencia confirmada para ${fullName}`);
    }
  };

  console.log('AttendeeInfo - Renderizando con datos:', {
    fullName, 
    email: attendee.email,
    church: attendee.church,
    sector: attendee.sector,
    paymentamount: attendee.paymentamount,
    isPaid
  });

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-bold text-center text-xl">
          {fullName}
        </CardTitle>
        <CardDescription className="text-center">
          {attendee.id}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="flex items-center justify-center border-2 border-dashed border-primary/20 p-2 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="font-medium text-sm">Asistencia Confirmada</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Datos Personales</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium text-lg">{fullName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Correo
              </p>
              <p className="font-medium">{attendee.email || 'No disponible'}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building className="h-3 w-3" /> Iglesia
              </p>
              <p className="font-medium">{attendee.church || 'No especificada'}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Sector
              </p>
              <p className="font-medium">{attendee.sector || 'No especificado'}</p>
            </div>
            
            {attendee.tshirtsize && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shirt className="h-3 w-3" /> Talla de Camiseta
                </p>
                <p className="font-medium">{attendee.tshirtsize}</p>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Fecha de Registro
            </p>
            <p className="font-medium">{formatDate(attendee.created_at)}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleConfirm}
        >
          Confirmar Asistencia
        </Button>
      </CardFooter>
    </Card>
  );
}