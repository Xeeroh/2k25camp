import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Mensajero de Paz Noroeste</h3>
            <p className="text-muted-foreground">
             <Heart size={14} className="mx-1 text-destructive" />
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-muted-foreground hover:text-primary transition-colors">
                  Registro
                </Link>
              </li>
              <li>
                <Link href="/comite" className="text-muted-foreground hover:text-primary transition-colors">
                  Comité
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <address className="not-italic text-muted-foreground">
              <p>Email: info@mdpnoroeste.org</p>
              <p>Teléfono: (123) 456-7890</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} MDP Noroeste. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0 flex items-center">
            Hecho con <Heart size={14} className="mx-1 text-destructive" /> para la comunidad
          </p>
        </div>
      </div>
    </footer>
  );
}