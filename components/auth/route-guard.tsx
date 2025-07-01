"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'viewer' | Array<'admin' | 'editor' | 'viewer'>;
}

export default function RouteGuard({ children, requiredRole = 'viewer' }: RouteGuardProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  function hasAnyRole(required: typeof requiredRole): boolean {
    if (!user) return false;
    if (Array.isArray(required)) {
      return required.some(role => hasRole(role));
    }
    return hasRole(required);
  }

  // Efecto para redirección si no cumple requisitos
  useEffect(() => {
    console.log('RouteGuard - Estado actual:', { 
      loading, 
      user: user ? { email: user.email, role: user.role } : null,
      requiredRole,
      hasRequiredRole: user ? hasAnyRole(requiredRole) : false
    });

    if (!loading) {
      if (!user) {
        console.log('RouteGuard - Usuario no autenticado, redirigiendo a /registro');
        toast.error('Debes iniciar sesión para acceder a esta página');
        router.push('/registro');
        return;
      }
      if (!hasAnyRole(requiredRole)) {
        console.log('RouteGuard - Usuario no tiene el rol requerido, redirigiendo a /');
        toast.error(`No tienes permisos para acceder a esta página`);
        router.push('/');
        return;
      }
    }
  }, [user, loading, hasRole, requiredRole, router]);

  // Mostrar spinner solo si loading es true
  if (loading) {
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
  if (!user || !hasAnyRole(requiredRole)) {
    return null;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
} 