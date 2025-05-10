"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import LoginForm from '@/components/admin/login-form';
import Dashboard from '@/components/admin/dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { user, loading, error, signOut, hasRole } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    console.log('Estado actual:', { user, loading, error });
    
    if (!loading && user) {
      console.log('Usuario autenticado, verificando rol...');
      if (!hasRole('viewer')) {
        console.log('Usuario no autorizado, redirigiendo...');
        router.push('/');
      } else {
        console.log('Usuario autorizado, mostrando dashboard...');
      }
    }
  }, [user, loading, hasRole, router]);

  const handleForceSignOut = async () => {
    try {
      console.log('Forzando cierre de sesión...');
      await signOut();
      console.log('Sesión cerrada correctamente');
      window.location.reload(); // Recargar después de cerrar sesión
    } catch (err) {
      console.error('Error al forzar cierre de sesión:', err);
    }
  };
  
  if (loading) {
    console.log('Mostrando estado de carga...');
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Cargando...</p>
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={handleForceSignOut}
                className="text-sm"
              >
                Forzar cierre de sesión
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    console.log('Mostrando error:', error);
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg max-w-md">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{error}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Recargar página
                </Button>
                <Button 
                  onClick={handleForceSignOut}
                  variant="destructive"
                >
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  console.log('Renderizando contenido principal:', { user });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-8">
        {user ? (
          <Dashboard onLogout={signOut} />
        ) : (
          <div className="max-w-md mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Administración</h1>
              <p className="text-muted-foreground">
                Inicie sesión para acceder al panel de administración
              </p>
            </div>
            
            <LoginForm />
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}