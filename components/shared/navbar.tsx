"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Opciones para configurar qué enlaces mostrar
interface NavbarProps {
  showInternalLinks?: boolean;
}

export default function Navbar({ showInternalLinks = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);

    // Intentamos detectar si estamos en un entorno interno
    // Esto es solo para propósitos de visualización, la seguridad real está en el middleware
    const checkInternalAccess = () => {
      // En producción, aquí implementarías la misma lógica que en el middleware
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      const hasInternalParam = new URLSearchParams(window.location.search).get('internal_access') === 'true';
      
      setIsInternal(showInternalLinks || isLocalhost || hasInternalParam);
    };
    
    checkInternalAccess();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showInternalLinks]);

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
              href="/" 
              className="text-2xl font-bold text-primary transition-colors"
            >
              MDP Noroeste
            </Link>
            
            {/* Indicador de modo interno */}
            {isInternal && (
              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                <Shield className="h-3 w-3 mr-1" /> Acceso Interno
              </Badge>
            )}
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/registro" className="text-foreground hover:text-primary transition-colors">
              Registro
            </Link>
            
            {/* Enlaces para acceso interno */}
            {isInternal && (
              <>
                <Link href="/comite" className="text-foreground hover:text-primary transition-colors">
                  Comité
                </Link>
                <Button asChild variant="outline">
                  <Link href="/admin">
                    Administración
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
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
      
      {/* Mobile menu */}
      <div className={cn(
        "md:hidden transition-all duration-300 overflow-hidden",
        isOpen ? "max-h-60 border-b" : "max-h-0"
      )}>
        <div className="px-4 pt-2 pb-4 space-y-1 bg-background">
          <Link 
            href="/" 
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Inicio
          </Link>
          <Link 
            href="/registro" 
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Registro
          </Link>
          
          {/* Enlaces para acceso interno en menú móvil */}
          {isInternal && (
            <>
              <Link 
                href="/comite" 
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Comité
              </Link>
              <Link 
                href="/admin" 
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Administración
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}