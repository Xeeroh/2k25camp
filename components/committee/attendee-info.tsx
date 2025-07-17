"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User,  QrCode, ShieldCheck, Shirt, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  // Si no hay datos, mostrar mensaje para escanear QR
  if (!attendee) {
    return (
      <Card className="card-clear w-full min-h-dvh max-h-dvh overflow-hidden">

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

  return (
    <Card className="card-clear w-full">
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
          <div className="p-2 sm:p-3 bg-black/20 rounded-full">
            <QrCode className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
          </div>
        </div>
        
        <div className="flex items-center justify-center border-2 border-dashed border-blue-400/50 p-2 rounded-lg mb-2">
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

        {/* Mostrar si es acreedor a camiseta */}
        <div className="flex items-center justify-center mb-2">
          {attendee.tshirtsize ? (
            <Badge className="bg-purple-600 text-white px-3 py-1 text-xs flex items-center gap-2">
              <Shirt className="h-4 w-4 mr-1" />
              Acreedor a camiseta — Talla: <span className="font-bold ml-1">{attendee.tshirtsize}</span>
            </Badge>
          ) : (
            <Badge className="bg-gray-400 text-white px-3 py-1 text-xs">N/A</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 justify-center mx-auto">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-blue-400/70 ">Email</p>
            <p className="text-sm sm:text-base text-white font-medium break-all">{attendee.email || 'No disponible'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm  text-blue-400/70 ">Iglesia</p>
            <p className="text-sm sm:text-base text-white font-medium">{attendee.church || 'No disponible'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm  text-blue-400/70 ">Sector</p>
            <p className="text-sm sm:text-base text-white font-medium">{attendee.sector || 'No disponible'}</p>
          </div>
          
          <div className='space-y-1'>
          <p className="text-xs sm:text-sm  text-blue-400/70 ">Estado</p>
          <p className="text-sm sm:text-base text-white font-medium">
            {attendee.paymentstatus ? (
              <Badge className={
                isPaid
                  ? 'bg-green-600 text-white'
                  : paymentStatus.toLowerCase().includes('pendiente')
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-400 text-white'
              }>
                {attendee.paymentstatus}
              </Badge>
            ) : 'No disponible'}
          </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm t text-blue-400/70 ">Monto</p>
            <p className="text-sm sm:text-base text-white font-medium">
              {attendee.paymentamount ? `$${attendee.paymentamount}` : 'No disponible'}
            </p>
          </div>
        </div>

        {!attendee.attendance_confirmed && (
          <Button 
            onClick={() => onConfirmAttendance && attendee.id && onConfirmAttendance(attendee.id)}
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