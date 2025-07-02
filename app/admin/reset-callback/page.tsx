"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const processResetCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Verificar si hay errores
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        
        if (error === 'access_denied' && errorCode === 'otp_expired') {
          toast.error('El enlace de restablecimiento ha expirado. Por favor, solicite uno nuevo.');
          router.push('/admin/reset-password');
          return;
        }

        // Esperar un momento para que Supabase procese la autenticación
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar si la sesión se estableció correctamente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al verificar sesión:', sessionError);
          toast.error('Error al procesar el enlace de restablecimiento');
          router.push('/admin/reset-password');
          return;
        }

        if (session) {
          // Redirigir a la página de actualización con parámetros especiales
          const updateUrl = '/admin/update-password?from_reset=true';
          router.push(updateUrl);
        } else {
          toast.error('No se pudo procesar el enlace de restablecimiento');
          router.push('/admin/reset-password');
        }
        
      } catch (error) {
        console.error('Error al procesar callback:', error);
        toast.error('Error al procesar el enlace de restablecimiento');
        router.push('/admin/reset-password');
      } finally {
        setIsProcessing(false);
      }
    };

    processResetCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">
            {isProcessing ? 
              "Procesando enlace de restablecimiento..." :
              "Redirigiendo..."
            }
          </p>
        </div>
      </div>
    </div>
  );
} 