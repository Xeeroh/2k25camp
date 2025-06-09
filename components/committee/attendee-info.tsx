"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, User, Calendar, Building, Mail, CreditCard, QrCode, ShieldCheck, Shirt, AlertTriangle } from 'lucide-react';
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
  attendance_number?: number;
  attendance_confirmed?: boolean;
  attendance_confirmed_at?: string;
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
      <Card className="card-clear w-full h-[70vh] md:h-[60vh]">
      <CardHeader>
      <CardTitle className="relative text-center text-white">
          <span className="absolute left-0">
          <User className="text-muted-foreground" />
          </span>
          Información del Asistente
      </CardTitle>

      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-full text-center">
        <User className="h-10 w-10 mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          Escanee un código QR para ver la información del asistente
        </p>
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
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="font-bold text-center text-lg sm:text-xl">
          {fullName}
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm">
          {attendee.id}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
            <QrCode className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
          </div>
        </div>
        
        <div className="flex items-center justify-center border-2 border-dashed border-primary/20 p-2 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            {attendee.attendance_confirmed ? (
              <>
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-xs sm:text-sm">
                  Asistencia Confirmada - Número: {attendee.attendance_number}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="font-medium text-xs sm:text-sm">Pendiente de Confirmar</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
            <p className="text-sm sm:text-base font-medium break-all">{attendee.email || 'No disponible'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Iglesia</p>
            <p className="text-sm sm:text-base font-medium">{attendee.church || 'No disponible'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Sector</p>
            <p className="text-sm sm:text-base font-medium">{attendee.sector || 'No disponible'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Monto</p>
            <p className="text-sm sm:text-base font-medium">
              {attendee.paymentamount ? `$${attendee.paymentamount}` : 'No disponible'}
            </p>
          </div>
        </div>

        {!attendee.attendance_confirmed && (
          <Button 
            onClick={handleConfirm}
            className="w-full mt-4"
            size="sm"
          >
            Confirmar Asistencia
          </Button>
        )}
      </CardContent>
    </Card>
  );
}