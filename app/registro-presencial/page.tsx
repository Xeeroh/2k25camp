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

const ROLES = [
  { label: 'Campista', value: 'campista', monto: 900 },
  { label: 'Pastor/esposa', value: 'pastor', monto: 600 },
  { label: 'Ujier', value: 'ujier', monto: 700 },
  { label: 'Multimedia', value: 'multimedia', monto: 700 },
  { label: 'Registro', value: 'registro', monto: 700 },
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
  const [registros, setRegistros] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sector, setSector] = useState('');
  const [ultimoId, setUltimoId] = useState<string | null>(null);

  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sector || (sector === 'Foráneo' && church.sector === 'Foráneo')
  );

  // Spinner de carga
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-r-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass border rounded-lg shadow p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene permisos
  if (!hasRole('admin') && !hasRole('editor')) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Sin permisos</h2>
            <p>No tienes permisos para acceder a esta página.</p>
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
      .or(`firstname.ilike.%${form.nombre}%,lastname.ilike.%${form.apellido}%,phone.eq.${form.telefono}`);
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
      // Solo permitir números y máximo 10 dígitos
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

  // Insertar en la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validar teléfono
      if (!isTelefonoValido(form.telefono)) {
        toast.error('El teléfono debe tener exactamente 10 dígitos.');
        setIsSubmitting(false);
        return;
      }
      // Validar duplicados
      const existe = await checkDuplicate();
      if (existe) {
        toast.error('Ya existe un registro con ese nombre o teléfono.');
        setIsSubmitting(false);
        return;
      }
      const nuevoNumero = await getNextAttendanceNumber();
      setNumeroCampista(nuevoNumero);
      // Insertar registro
      const { data: insertData, error: insertError } = await supabase.from('attendees').insert({
        firstname: form.nombre,
        lastname: form.apellido,
        email: form.email,
        church: form.iglesia,
        sector: sector,
        phone: form.telefono,
        notes: form.notas,
        paymentamount: 0,
        expectedamount: monto,
        paymentstatus: 'Pendiente',
        attendance_number: nuevoNumero,
        registrationdate: new Date().toISOString(),
      }).select('id').single();
      console.log('insert attendee:', { insertData, insertError });
      if (insertError) throw insertError;
      setUltimoId(insertData?.id || null);
      toast.success('¡Registro exitoso!');
      // No limpiar aquí, para mostrar botones de acción
    } catch (error: any) {
      toast.error('Error al registrar campista: ' + (error?.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marcar como pagado
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

  // Responsive y botones más compactos
  const inputClass = "w-full text-sm text-black border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80";
  const buttonClass = "w-full sm:w-auto px-4 py-2 rounded text-sm font-semibold";

  return (
    <div className="min-h-screen flex flex-col bg-try">
      <Navbar showInternalLinks={true} />
      <div className="flex-1 py-12 bg-muted/30 bg-try flex justify-center items-center">
        <div className="max-w-xl mx-auto p-6 card-glass rounded shadow">
          <h1 className="text-2xl font-bold mb-4 text-blue-100 text-center">Registro Presencial de Campistas</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Nombre(s) <span className="text-red-600">*</span></label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputClass} autoFocus tabIndex={1} />
              </div>
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Apellido(s) <span className="text-red-600">*</span></label>
                <input name="apellido" value={form.apellido} onChange={handleChange} required className={inputClass} tabIndex={2} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Correo electrónico <span className="text-red-600">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} tabIndex={3} />
              </div>
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Teléfono <span className="text-red-600">*</span></label>
                <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} required className={inputClass} tabIndex={4} maxLength={10} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Sector <span className="text-red-600">*</span></label>
                <select
                  name="sector"
                  value={sector}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  tabIndex={5}
                >
                  <option value="">Seleccione un sector</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="Foráneo">Foráneo</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Iglesia <span className="text-red-600">*</span></label>
                <select
                  name="iglesia"
                  value={form.iglesia}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={!sector}
                  tabIndex={6}
                >
                  <option value="">{sector ? 'Seleccione una iglesia' : 'Primero seleccione un sector'}</option>
                  {filteredChurches.map((church) => (
                    <option key={`${church.sector}-${church.name}`} value={church.name}>{church.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Rol <span className="text-red-600">*</span></label>
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  tabIndex={7}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-blue-400 text-sm mb-1">Monto a pagar <span className="text-red-600">*</span></label>
                <input
                  value={`$${monto}`}
                  disabled
                  readOnly
                  className={inputClass + ' bg-gray-100'}
                  tabIndex={8}
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-blue-400 text-sm mb-1">Notas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} className={inputClass} tabIndex={9} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center items-center w-full">
              <button type="submit" className={buttonClass + ' bg-blue-600 text-white'} disabled={isSubmitting} tabIndex={10}>
                {isSubmitting ? 'Registrando...' : 'Registrar y pasar a caja'}
              </button>
              <button type="button" className={buttonClass + ' bg-gray-300 text-black'} onClick={limpiarFormulario} disabled={isSubmitting} tabIndex={11}>
                Limpiar formulario
              </button>
            </div>
          </form>
          {numeroCampista && (
            <div className="mt-6 p-4 bg-green-100 rounded text-green-800 font-semibold flex flex-col gap-4 items-center">
              ¡Registro exitoso! Número de campista asignado: {numeroCampista}
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center mt-2">
                <button
                  className={buttonClass + ' bg-green-600 text-white'}
                  onClick={marcarComoPagado}
                  disabled={!ultimoId}
                >
                  Marcar como pagado
                </button>
                <button
                  className={buttonClass + ' bg-blue-500 text-white'}
                  onClick={limpiarFormulario}
                >
                  Registrar otro campista
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}