"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, User, Calendar, Building, Mail, CreditCard } from 'lucide-react';
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información del Asistente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estado de pago */}
        <div className={`rounded-lg p-4 flex items-center gap-3 ${isPaid ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
          {isPaid ? (
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <div>
            <p className={`font-semibold ${isPaid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isPaid ? 'Pago Confirmado' : 'Pago Pendiente'}
            </p>
            <p className="text-sm">
              {isPaid 
                ? `Pago de $${attendee.paymentamount || 0} recibido` 
                : 'El asistente debe completar su pago'}
            </p>
          </div>
        </div>
        
        {/* Información personal */}
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