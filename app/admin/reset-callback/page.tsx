"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

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
    <div 
      className="bg-try min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0d0d50, #005089)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div 
            className="card-glass shadow-lg border border-border rounded-lg p-8 text-center"
            style={{
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              backgroundColor: 'rgba(17, 25, 40, 0.75)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.125)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              padding: '2rem'
            }}
          >
            <div 
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6"
              style={{
                width: '4rem',
                height: '4rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}
            >
              <Shield className="h-8 w-8 text-primary" style={{ color: '#3b82f6' }} />
            </div>
            
            <h2 
              className="text-2xl font-bold tracking-tight mb-4"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                marginBottom: '1rem',
                color: '#ffffff'
              }}
            >
              Procesando Enlace
            </h2>
            
            <div 
              className="flex items-center justify-center mb-6"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <Loader2 
                className="h-8 w-8 animate-spin text-primary" 
                style={{ 
                  color: '#3b82f6',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            </div>
            
            <p 
              className="text-muted-foreground"
              style={{
                color: '#9ca3af',
                marginBottom: '1.5rem'
              }}
            >
              {isProcessing ? 
                "Procesando enlace de restablecimiento..." :
                "Redirigiendo..."
              }
            </p>
            
            <div className="mt-6">
              <div 
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                style={{
                  backgroundColor: 'rgba(239, 246, 255, 0.9)',
                  border: '1px solid rgba(147, 197, 253, 0.5)',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}
              >
                <p 
                  className="text-sm text-blue-800"
                  style={{
                    fontSize: '0.875rem',
                    color: '#1e40af'
                  }}
                >
                  <strong>¿Qué está pasando?</strong><br />
                  Estamos verificando tu enlace de restablecimiento y configurando tu sesión de forma segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 