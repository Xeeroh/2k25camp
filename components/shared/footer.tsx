import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/5 border-t border-white/10 py-16 mt-auto backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-tighter">
              CAMPAMENTO 2026
            </h3>
            <p className="text-blue-100/60 max-w-sm font-light">
              Uniendo generaciones en fe y propósito. Sistema oficial de registro para el Campamento Alfa y Omega.
            </p>
          </div>
          
          <div className="md:text-right space-y-4">
            <h3 className="text-xl font-bold text-white tracking-widest uppercase text-sm">Contáctanos</h3>
            <address className="not-italic text-blue-100/60 space-y-2">
              <p className="hover:text-white transition-colors cursor-pointer">soporte@mdpnoroeste.org</p>
              <p className="text-[10px] tracking-widest text-[#f4540a] font-black">MDP NOROESTE</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-blue-100/30 font-bold tracking-widest uppercase">
            &copy; {currentYear} MDP Noroeste • Todos los derechos reservados
          </p>
          <p className="text-[10px] text-blue-100/30 font-bold tracking-widest uppercase flex items-center gap-2">
            DESIGNED FOR <span className="text-[#f4540a]">2026 EXPERIENCE</span> <Heart size={10} className="text-[#f4540a] fill-[#f4540a]" />
          </p>
        </div>
      </div>
    </footer>
  );
}