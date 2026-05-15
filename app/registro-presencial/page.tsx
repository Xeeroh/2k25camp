'use client'
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import LoginForm from '@/components/admin/login-form';
import { supabase } from '@/lib/supabase';
import { CHURCHES_DATA } from '@/lib/churches-data';
import { toast } from 'sonner';
import { getNextAttendanceNumber } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Church, 
  UserSquare2, 
  DollarSign, 
  StickyNote, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLES = [
  { label: 'Campista', value: 'campista', monto: 900 },
  { label: 'Pastor', value: 'pastor', monto: 0 },
  { label: 'Esposa de Pastor', value: 'esposa', monto: 600 },
  { label: 'Ujier', value: 'ujier', monto: 700 },
  { label: 'Multimedia', value: 'multimedia', monto: 700 },
  { label: 'Registro', value: 'registro', monto: 700 },
  { label: 'Comite', value: 'comite', monto: 0 },
];

export default function RegistroPresencial() {
  const { user, loading, error: authError, hasRole } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    iglesia: '',
    telefono: '',
    rol: ROLES[0].value,
    notas: '',
  });
  const [monto, setMonto] = useState(ROLES[0].monto);
  const [numeroCampista, setNumeroCampista] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sector, setSector] = useState('');
  const [ultimoId, setUltimoId] = useState<string | null>(null);

  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sector || (sector === 'Foráneo' && church.sector === 'Foráneo')
  );

  // Spinner de carga
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-950">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#f4540a] border-r-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-blue-100/60 font-medium">Cargando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-950">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass p-8 w-full max-w-md rounded-[32px] border border-white/5 shadow-2xl">
            <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-tight italic">Acceso <span className="text-[#f4540a]">Comité</span></h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene permisos
  if (!hasRole('admin') && !hasRole('editor')) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-950">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-8 rounded-[32px] max-w-md text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-2 uppercase italic">Acceso Denegado</h2>
            <p className="text-red-200/60">No tienes permisos para realizar registros presenciales.</p>
          </div>
        </div>
      </div>
    );
  }

  // Validar teléfono: solo números y 10 dígitos
  const isTelefonoValido = (telefono: string) => {
    const soloNumeros = telefono.replace(/\D/g, '');
    return soloNumeros.length === 10;
  };

  // Buscar duplicados por nombre y/o teléfono
  const checkDuplicate = async () => {
    const { data, error } = await supabase
      .from('attendees')
      .select('id')
      .or(`firstname.ilike.%${form.nombre}%,lastname.ilike.%${form.apellido}`);
    return data && data.length > 0;
  };

  const limpiarFormulario = () => {
    setForm({ nombre: '', apellido: '', email: '', iglesia: '', telefono: '', rol: ROLES[0].value, notas: '' });
    setMonto(ROLES[0].monto);
    setSector('');
    setNumeroCampista(null);
    setUltimoId(null);
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, telefono: soloNumeros }));
      return;
    }
    if (name === 'sector') {
      setSector(value);
      setForm(prev => ({ ...prev, iglesia: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'rol') {
      const rolSeleccionado = ROLES.find(r => r.value === value);
      setMonto(rolSeleccionado ? rolSeleccionado.monto : 900);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (form.telefono && !isTelefonoValido(form.telefono)) {
        toast.error('El teléfono debe tener exactamente 10 dígitos.');
        setIsSubmitting(false);
        return;
      }
      const nuevoNumero = await getNextAttendanceNumber();
      setNumeroCampista(nuevoNumero);
      const { data: insertData, error: insertError } = await supabase.from('attendees').insert({
        firstname: form.nombre,
        lastname: form.apellido,
        email: form.email,
        church: form.iglesia,
        sector: sector,
        phone: form.telefono,
        notes: form.notas,
        paymentamount: 0,
        paymentstatus: 'Pendiente',
        attendance_number: nuevoNumero,
        registrationdate: new Date().toISOString(),
      }).select('id').single();
      
      if (insertError) throw insertError;
      setUltimoId(insertData?.id || null);
      toast.success('¡Registro exitoso!');
    } catch (error: any) {
      toast.error('Error al registrar campista: ' + (error?.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const marcarComoPagado = async () => {
    if (!ultimoId) return;
    const { error } = await supabase.from('attendees').update({ paymentstatus: 'Pagado', paymentamount: monto }).eq('id', ultimoId);
    if (!error) {
      toast.success('¡Marcado como pagado!');
      setNumeroCampista(null);
      setUltimoId(null);
      limpiarFormulario();
    } else {
      toast.error('Error al actualizar el pago.');
    }
  };

  const labelClass = "flex items-center gap-2 font-bold text-blue-100/60 text-[10px] uppercase tracking-widest mb-1.5 ml-1";
  const inputClass = "w-full bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-[#f4540a]/30 focus:border-[#f4540a] rounded-xl h-11 px-4 transition-all outline-none";
  const selectClass = "w-full bg-white/5 border-white/10 text-white focus:ring-[#f4540a]/30 focus:border-[#f4540a] rounded-xl h-11 px-4 transition-all outline-none appearance-none";

  return (
    <div className="min-h-screen flex flex-col bg-blue-950 selection:bg-[#f4540a]/30">
      <Navbar showInternalLinks={true} />
      
      <main className="flex-1 py-12 px-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#f4540a]/5 rounded-full blur-[120px] -ml-64 -mb-64" />

        <div className="max-w-xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              Registro <span className="text-[#f4540a]">Presencial</span>
            </h1>
            <p className="text-blue-100/40 text-sm font-medium uppercase tracking-[0.2em]">Campamento 2K26 · Walk-in</p>
          </div>

          {!numeroCampista ? (
            <div className="card-glass border border-white/5 p-8 rounded-[32px] shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}><User className="h-3 w-3" /> Nombre(s)</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputClass} placeholder="Ej. Juan" autoFocus />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}><User className="h-3 w-3" /> Apellido(s)</label>
                    <input name="apellido" value={form.apellido} onChange={handleChange} required className={inputClass} placeholder="Ej. Pérez" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}><Mail className="h-3 w-3" /> Email (Opcional)</label>
                    <input 
                      name="email" 
                      type="email" 
                      value={form.email} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}><Phone className="h-3 w-3" /> Teléfono (Emergencia)</label>
                    <input 
                      name="telefono" 
                      type="tel" 
                      value={form.telefono} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="10 dígitos (Opcional)"
                      maxLength={10} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}><MapPin className="h-3 w-3" /> Sector</label>
                    <select name="sector" value={sector} onChange={handleChange} className={selectClass} required>
                      <option value="" className="bg-blue-950 text-white/40">Seleccionar</option>
                      {[1, 2, 3, 4, 5, 'Foráneo'].map(s => (
                        <option key={s} value={s} className="bg-blue-950">Sector {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}><Church className="h-3 w-3" /> Iglesia</label>
                    <select name="iglesia" value={form.iglesia} onChange={handleChange} className={selectClass} required disabled={!sector}>
                      <option value="" className="bg-blue-950 text-white/40">{sector ? 'Seleccionar' : 'Primero sector'}</option>
                      {filteredChurches.map((church) => (
                        <option key={`${church.sector}-${church.name}`} value={church.name} className="bg-blue-950 text-white">{church.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}><UserSquare2 className="h-3 w-3" /> Rol</label>
                    <select name="rol" value={form.rol} onChange={handleChange} className={selectClass} required>
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value} className="bg-blue-950">{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}><DollarSign className="h-3 w-3" /> Monto</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f4540a] font-black">$</div>
                      <input value={monto} disabled readOnly className={cn(inputClass, "pl-8 bg-blue-900/20 border-blue-500/10 text-[#f4540a] font-black text-xl shadow-inner")} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}><StickyNote className="h-3 w-3" /> Notas Adicionales</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} className={cn(inputClass, "h-20 py-3 resize-none")} placeholder="Observaciones..." />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" className="h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-bold" onClick={limpiarFormulario} disabled={isSubmitting}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Limpiar
                  </Button>
                  <Button type="submit" variant="tangelo" className="h-12 rounded-xl font-black italic uppercase tracking-tight shadow-xl shadow-orange-900/20" disabled={isSubmitting}>
                    {isSubmitting ? '...' : <>REGISTRAR <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="card-glass border border-white/5 p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide italic">¡ÉXITO EN REGISTRO!</h2>
                <p className="text-blue-100/40 text-sm mb-6">Entrega el número asignado:</p>

                <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-8 rounded-3xl border border-white/5 w-full mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PlusCircle className="h-24 w-24 text-white" />
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#f4540a] mb-2 font-mono">ID CAMPISTA</p>
                  <span className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(244,84,10,0.4)]">
                    #{numeroCampista?.toString().padStart(3, '0')}
                  </span>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={limpiarFormulario} 
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-lg shadow-xl shadow-blue-900/40"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" /> SIGUIENTE REGISTRO
                  </Button>
                  
                  <Button 
                    onClick={marcarComoPagado} 
                    variant="tangelo" 
                    className="h-12 rounded-xl font-bold uppercase text-sm opacity-90 hover:opacity-100"
                    disabled={!ultimoId}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Marcar como Pagado en Caja
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" className="text-red-400/50 hover:text-red-400 hover:bg-red-400/5 transition-colors" onClick={limpiarFormulario}>
                  <Trash2 className="h-4 w-4 mr-2" /> Descartar y volver
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}