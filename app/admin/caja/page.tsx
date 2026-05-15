"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import FooterL from '@/components/shared/footerL';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Attendee } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import CajaHistorial from '@/components/caja/caja-historial';
import { 
  Search, 
  DollarSign, 
  User, 
  Banknote, 
  TrendingUp, 
  ArrowRight, 
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shirt,
  MapPin,
  Loader2,
  RotateCcw,
  BadgeDollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LoginForm from '@/components/admin/login-form';

export default function CajaPage() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [suggestedAttendees, setSuggestedAttendees] = useState<Attendee[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalToday: 0,
    countToday: 0
  });

  // Calculadora de cambio
  const [montoRecibido, setMontoRecibido] = useState<number | ''>('');
  const [cambio, setCambio] = useState<number>(0);

  useEffect(() => {
    if (!loading && user) {
      if (!hasRole('admin')) {
        toast.error('No tienes permisos de administrador');
        router.push('/');
      }
      fetchStats();
    }
  }, [user, loading]);

  useEffect(() => {
    if (attendee && montoRecibido !== '') {
      const deuda = 900 - (attendee.paymentamount || 0);
      const res = Number(montoRecibido) - deuda;
      setCambio(res > 0 ? res : 0);
    } else {
      setCambio(0);
    }
  }, [montoRecibido, attendee]);

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: logs } = await supabase
      .from('caja_log')
      .select('monto_actual, monto_anterior')
      .gte('fecha', today.toISOString());
    
    if (logs) {
      const total = logs.reduce((acc, log) => acc + (log.monto_actual - log.monto_anterior), 0);
      setStats({ totalToday: total, countToday: logs.length });
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    setLoadingSearch(true);
    setError('');
    setAttendee(null);
    setSuggestedAttendees([]);
    setMontoRecibido('');

    try {
      const query = supabase.from('attendees');
      let data, error;

      if (/^\d+$/.test(search.trim())) {
        ({ data, error } = await query.select('*').eq('attendance_number', Number(search.trim())).single());
        if (data) setAttendee(data);
        else setError('No se encontró el # de campista.');
      } else {
        const result = await query
          .select('*')
          .or(`firstname.ilike.%${search.trim()}%,lastname.ilike.%${search.trim()}%`)
          .limit(10);

        if (result.error) throw result.error;
        
        if (result.data.length === 0) setError('Sin coincidencias.');
        else if (result.data.length === 1) setAttendee(result.data[0]);
        else setSuggestedAttendees(result.data);
      }
    } catch (e) {
      setError('Error en la búsqueda.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePago = async (method: string = 'Efectivo') => {
    if (!attendee) return;
    
    const anterior = attendee.paymentamount || 0;
    const deuda = 900 - anterior;
    const nuevoTotal = 900;

    const { error: updateError } = await supabase
      .from('attendees')
      .update({
        paymentstatus: 'Pagado',
        paymentamount: nuevoTotal,
      })
      .eq('id', attendee.id);

    if (!updateError) {
      await supabase.from('caja_log').insert({
        attendee_id: attendee.id,
        nombre: `${attendee.firstname} ${attendee.lastname}`,
        monto_anterior: anterior,
        monto_actual: nuevoTotal,
        motivo: `Pago completo en ${method}`,
        modificado_por: user?.email || 'Caja',
      });

      toast.success('¡Registro liquidado exitosamente!');
      setAttendee({ 
        ...attendee, 
        paymentstatus: 'Pagado', 
        paymentamount: nuevoTotal 
      });
      setMontoRecibido('');
      fetchStats();
    } else {
      toast.error('Error al procesar pago');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-try flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-[#f4540a] animate-spin mb-4" />
          <p className="text-white/40 font-medium">Cargando caja...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-try flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass p-8 w-full max-w-md">
            <h1 className="text-2xl font-black text-white text-center mb-6">Iniciar Sesión - Caja</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  const deuda = 900 - (attendee?.paymentamount || 0);

  return (
    <div className="min-h-screen flex flex-col bg-try">
      <Navbar showInternalLinks={true} />
      
      <div className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                Estación de <span className="text-[#f4540a]">Caja</span>
              </h1>
              <p className="text-white/40 font-bold text-sm tracking-wide">REGISTRO DE PAGOS EN EFECTIVO</p>
            </div>

            <div className="flex gap-4">
              <div className="card-glass px-6 py-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-[#f4540a] uppercase tracking-widest">Cobrado Hoy</span>
                <span className="text-3xl font-black text-white">${stats.totalToday}</span>
              </div>
              <div className="card-glass px-6 py-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Envíos</span>
                <span className="text-3xl font-black text-white">{stats.countToday}</span>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="relative flex gap-3 p-2 card-glass rounded-3xl border border-white/10">
              <div className="flex-1 flex items-center px-4 gap-3 bg-white/5 rounded-2xl">
                <Search className="h-5 w-5 text-white/20" />
                <input
                  type="text"
                  placeholder="Número de campista o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent border-0 text-white placeholder:text-white/10 h-14 outline-none focus:ring-0 font-bold"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={loadingSearch}
                className="h-14 px-8 rounded-2xl bg-[#f4540a] hover:bg-[#d44808] text-white font-black"
              >
                {loadingSearch ? <Loader2 className="h-5 w-5 animate-spin" /> : "BUSCAR"}
              </Button>
            </div>
            {error && <p className="text-[#f4540a] text-center mt-3 font-bold animate-pulse">{error}</p>}
          </div>

          {/* Sugerencias */}
          {suggestedAttendees.length > 0 && !attendee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
              {suggestedAttendees.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setAttendee(a); setSuggestedAttendees([]); setSearch(''); }}
                  className="flex items-center gap-4 p-4 card-glass border border-white/5 hover:border-[#f4540a]/30 transition-all text-left group"
                >
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-white group-hover:bg-[#f4540a]">
                    {a.firstname.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{a.firstname} {a.lastname}</p>
                    <p className="text-xs text-white/40 font-black">#{a.attendance_number}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/10" />
                </button>
              ))}
            </div>
          )}

          {attendee && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <div className="card-glass p-8 rounded-[2rem] h-full space-y-6">
                  <div className="relative group/avatar">
                    <div className="h-24 w-full bg-white/5 rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f4540a]/10 to-transparent opacity-50" />
                      <User className="h-10 w-10 text-[#f4540a] relative z-10" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 relative z-10">Ficha de Campista</span>
                    </div>
                    <Badge className="absolute -top-3 -right-3 bg-[#f4540a] text-white border-0 font-black text-xl px-5 py-2 rounded-2xl shadow-xl shadow-[#f4540a]/20">
                      #{attendee.attendance_number?.toString().padStart(3, '0')}
                    </Badge>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-black text-white leading-tight">
                      {attendee.firstname} <br/> 
                      <span className="text-white/40">{attendee.lastname}</span>
                    </h2>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-[#f4540a]" />
                      <span className="text-sm font-bold text-white/60 uppercase">{attendee.church}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shirt className="h-4 w-4 text-[#f4540a]" />
                      <span className="text-sm font-bold text-white/60 uppercase">Talla {attendee.tshirtsize || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculator Section */}
              <div className="lg:col-span-3">
                <div className="card-glass p-8 rounded-[2rem] h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <p className="text-xs font-black text-white/40 tracking-widest uppercase">Liquidación de Cuenta</p>
                    <div className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black border",
                      attendee.paymentstatus === 'Pagado' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-[#f4540a] border-[#f4540a]/20 animate-pulse"
                    )}>
                      {attendee.paymentstatus === 'Pagado' ? "PAGADO" : "DEUDA PENDIENTE"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-5 rounded-2xl">
                      <p className="text-[10px] font-black text-white/40 mb-1">PAGADO ANTERIOR</p>
                      <p className="text-2xl font-black text-white">${attendee.paymentamount || 0}</p>
                    </div>
                    <div className="bg-red-500/10 p-5 rounded-2xl">
                      <p className="text-[10px] font-black text-[#f4540a] mb-1 uppercase tracking-wider font-extrabold">Faltante por cobrar</p>
                      <p className="text-3xl font-black text-[#f4540a]">${deuda}</p>
                    </div>
                  </div>

                  {attendee.paymentstatus !== 'Pagado' ? (
                    <div className="space-y-6 flex-1 flex flex-col justify-end">
                      {/* Calculadora de Cambio */}
                      <div className="card-glass border-[#f4540a]/10 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-[#f4540a] tracking-widest uppercase">Calculadora de Cambio</p>
                          <Banknote className="h-5 w-5 text-[#f4540a]" />
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Efectivo Recibido</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">$</span>
                              <input 
                                type="number" 
                                placeholder="0"
                                value={montoRecibido}
                                onChange={(e) => setMontoRecibido(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-white/5 border-white/10 rounded-xl py-3 pl-8 text-white font-black outline-none focus:border-[#f4540a]"
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Cambio a Entregar</label>
                            <div className="bg-white/5 border border-white/5 rounded-xl py-3 px-4 flex items-center justify-between">
                              <span className="text-white/20 font-black">$</span>
                              <span className="text-2xl font-black text-green-400">{cambio}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handlePago()}
                        className="w-full h-20 rounded-3xl bg-[#f4540a] hover:bg-[#d44808] text-white font-black text-xl shadow-2xl shadow-[#f4540a]/20"
                      >
                        LIQUIDAR $900 AHORA
                        <CheckCircle2 className="ml-3 h-6 w-6" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                      <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
                      <p className="text-xl font-black text-white">CUENTA LIQUIDADA</p>
                      <Button variant="link" onClick={() => setAttendee(null)} className="text-[#f4540a] font-black uppercase text-xs tracking-widest mt-4">
                        <RotateCcw className="h-3 w-3 mr-2" />Nueva Búsqueda
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#f4540a]" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Historial de Cobros</h3>
            </div>
            <CajaHistorial />
          </div>

        </div>
      </div>
      <FooterL />
    </div>
  );
}