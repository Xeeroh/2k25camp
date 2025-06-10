import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function FooterL() {
  const currentYear = new Date().getFullYear();

  return (
    // Clases corregidas y mejoradas aquí
    <footer className=" bottom-0 left-0 w-full py-6 ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">
          
        <div className="grid gap-6 text-center sm:grid-cols-1 md:grid-cols-3 md:text-left">
          {/* Columna 1: Logo/Nombre */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold"></h3>
            <p className="text-muted-foreground">
            </p>
          </div>
        </div>
        
      </div>
        
        {/* Divisor y Copyright */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6 text-center md:flex-row md:justify-between md:text-left">
        <p className="mt-4 flex items-center text-sm text-muted-foreground md:mt-0">
            Hecho con <Heart size={14} className="mx-1.5 text-destructive" /> para la comunidad
          </p>
          
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} MDP Noroeste. Todos los derechos reservados.
          </p>

          <h6 className="text-sm font-semibold text-muted-foreground">
            Contacto
            <address className="italic text-muted-foreground">
            <a href="mailto:soporte@mdpnoroeste.org" className="hover:text-primary">
                soporte@mdpnoroeste.org
              </a>
            </address>
          </h6>
          
           

          
        </div>
      </div>
    </footer>
  );
}