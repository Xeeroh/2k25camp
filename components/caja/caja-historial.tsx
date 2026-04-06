'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Log {
  id: string;
  nombre: string;
  monto_anterior: number;
  monto_actual: number;
  motivo: string;
  modificado_por: string;
  fecha: string;
}

export default function CajaHistorial() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('caja_log')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl bg-white/5 border border-white/5" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card-glass p-12 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <HelpCircle className="h-8 w-8 text-white/10" />
        </div>
        <p className="text-white/20 font-bold tracking-tight text-lg italic">No hay transacciones registradas hoy</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
      {logs.map((log) => {
        const montoCobrado = log.monto_actual - log.monto_anterior;
        const isTotal = log.monto_actual >= 900;

        return (
          <div 
            key={log.id} 
            className="group relative h-full card-glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="h-20 w-20 text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
              {/* Profile Shortcut */}
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                 <User className="h-5 w-5 text-[#f4540a]" />
                 <span className="text-[9px] font-black text-white/40 mt-1 uppercase">INFO</span>
              </div>

              {/* Main Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-black text-white tracking-tight leading-none">{log.nombre}</h4>
                  {isTotal && (
                     <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] font-black uppercase px-2">LIQUIDADO</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                    <Clock className="h-3 w-3" />
                    {new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold truncate">
                    <ShieldCheck className="h-3 w-3 text-blue-400" />
                    POR: {log.modificado_por}
                  </div>
                </div>
                <div className="text-[11px] text-white/20 font-medium uppercase tracking-[0.05em] mt-2 italic">
                  Motivo: {log.motivo}
                </div>
              </div>

              {/* Amount Display */}
              <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5 min-w-[200px] justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">TOTAL ACTUAL</span>
                  <span className="text-xl font-black text-white">${log.monto_actual}</span>
                </div>
                
                <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white/10" />
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-[#f4540a] uppercase tracking-widest leading-none">COBRADO</span>
                  <span className="text-xl font-black text-green-400">+${montoCobrado}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
