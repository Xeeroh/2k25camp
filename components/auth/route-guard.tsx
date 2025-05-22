"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'viewer';
}

export default function RouteGuard({ children, requiredRole = 'viewer' }: RouteGuardProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('RouteGuard - Estado actual:', { 
      loading, 
      user: user ? { email: user.email, role: user.role } : null,
      requiredRole,
      hasRequiredRole: user ? hasRole(requiredRole) : false
    });

    if (!loading) {
      setIsChecking(false);
      
      if (!user) {
        console.log('RouteGuard - Usuario no autenticado, redirigiendo a /registro');
        toast.error('Debes iniciar sesión para acceder a esta página');
        router.push('/registro');
        return;
      }
      
      if (!hasRole(requiredRole)) {
        console.log('RouteGuard - Usuario no tiene el rol requerido, redirigiendo a /');
        toast.error(`No tienes permisos de ${requiredRole} para acceder a esta página`);
        router.push('/');
        return;
      }
    }
  }, [user, loading, hasRole, requiredRole, router]);

  // Si está cargando o verificando, mostrar el spinner
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario o no tiene el rol requerido, no mostrar nada
  if (!user || !hasRole(requiredRole)) {
    return null;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
} 