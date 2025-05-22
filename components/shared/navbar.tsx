"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

// Opciones para configurar qué enlaces mostrar
interface NavbarProps {
  showInternalLinks?: boolean;
}

export default function Navbar({ showInternalLinks = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading, signOut, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const isAdmin = hasRole('admin');
  const isEditor = hasRole('editor');
  const showInternalNav = showInternalLinks || isAdmin || isEditor;

  // Define paths that are exclusive to administrators
  const adminOnlyPaths = ['/admin'];

  // Función para crear enlaces con lógica de acceso
  const createInternalLink = (path: string): string => {
    // Si no hay usuario o está cargando, retornar la ruta base
    if (!user || loading) {
      return path;
    }

    // 1. Check if the path is an admin-only path
    if (adminOnlyPaths.includes(path)) {
      if (isAdmin) {
        return `${path}?internal_access=true`;
      } else {
        return '/registro';
      }
    }

    // 2. For non-admin paths:
    // Always add internal_access=true for authenticated users
    if (user) {
      return `${path}?internal_access=true`;
    }
    
    // 3. For non-authenticated users, return the path as is
    return path;
  };

  // Función para manejar la navegación
  const handleNavigation = (path: string) => {
    setIsOpen(false); // Cerrar el menú móvil si está abierto
    const finalPath = createInternalLink(path);
    if (finalPath !== pathname) {
      // Forzar un reload completo de la página
      window.location.href = finalPath;
    }
  };

  // Si está cargando, mostrar una versión simplificada del navbar
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              Mensajero de Paz Noroeste
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/95 backdrop-blur-sm shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href={user ? createInternalLink('/') : '/'}
              className="text-2xl font-bold text-primary transition-colors"
              onClick={() => handleNavigation('/')}
            >
              Mensajero de Paz Noroeste
            </Link>
            
            {showInternalNav && user && (
              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                <Shield className="h-3 w-3 mr-1" /> 
                {isAdmin ? 'Admin' : isEditor ? 'Comité' : 'Acceso Interno'}
              </Badge>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href={user ? createInternalLink('/') : '/'} 
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigation('/')}
            >
              Inicio
            </Link>
            <Link 
              href={user ? createInternalLink('/registro') : '/registro'} 
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigation('/registro')}
            >
              Registro
            </Link>
            
            {showInternalNav && user && (
              <>
                {isEditor && (
                  <Link 
                    href={createInternalLink('/comite')}
                    className="text-foreground hover:text-primary transition-colors"
                    onClick={() => handleNavigation('/comite')}
                  >
                    Comité
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link 
                      href={createInternalLink('/admin')}
                      className="text-foreground hover:text-primary transition-colors"
                      onClick={() => handleNavigation('/admin')}
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "md:hidden transition-all duration-300 overflow-hidden",
        isOpen ? "max-h-60 border-b" : "max-h-0"
      )}>
        <div className="px-4 pt-2 pb-4 space-y-1 bg-background">
          <Link 
            href={user ? createInternalLink('/') : '/'}
            className="block w-full text-left px-3 py-2 rounded-md hover:bg-accent"
            onClick={() => handleNavigation('/')}
          >
            Inicio
          </Link>
          <Link 
            href={user ? createInternalLink('/registro') : '/registro'}
            className="block w-full text-left px-3 py-2 rounded-md hover:bg-accent"
            onClick={() => handleNavigation('/registro')}
          >
            Registro
          </Link>
          
          {showInternalNav && user && (
            <>
              {isEditor && (
                <Link 
                  href={createInternalLink('/comite')}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-accent"
                  onClick={() => handleNavigation('/comite')}
                >
                  Comité
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link 
                    href={createInternalLink('/admin')}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-accent"
                    onClick={() => handleNavigation('/admin')}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}