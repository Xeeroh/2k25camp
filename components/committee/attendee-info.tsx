"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, QrCode, ShieldCheck, Shirt, AlertTriangle, MapPin, Mail, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
        <div className="flex justify-center mb-0">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#f4540a] to-transparent w-full opacity-30" />
        </div>
        
        {/* Ficha Visual de Confirmación / Número de Campista */}
        <div className="relative group">
          {attendee.attendance_confirmed ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-2xl border border-green-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-6 -right-6 opacity-10">
                <ShieldCheck className="h-24 w-24 text-green-400" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-black mb-2">Asistencia Confirmada</p>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase font-bold mb-1">Número Asignado:</span>
                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  #{attendee.attendance_number?.toString().padStart(3, '0')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2 animate-pulse" />
              <p className="text-yellow-500 font-black uppercase tracking-widest text-sm">Pendiente de Confirmar</p>
            </div>
          )}
        </div>

        {/* Info de Dotación y Pago (Rápida) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold mb-1">Talla Camiseta</p>
            {attendee.tshirtsize && attendee.tshirtsize !== 'NA' ? (
              <Badge className="bg-[#f4540a] text-white font-black px-4 py-1 text-lg">
                {attendee.tshirtsize}
              </Badge>
            ) : (
              <span className="text-white/20 font-black">N/A</span>
            )}
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold mb-1">Estado Pago</p>
            <Badge className={cn("px-3 py-1 font-bold",
              isPaid ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'
            )} variant="outline">
              {attendee.paymentstatus}
            </Badge>
          </div>
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
            className="w-full bg-[#f4540a] hover:bg-orange-600 text-white font-black py-6 rounded-2xl shadow-xl shadow-orange-900/30 text-lg transition-transform active:scale-95"
          >
            CONFIRMAR ASISTENCIA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}