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
import LoginForm from '@/components/admin/login-form';
import { toast } from 'sonner';
import CajaHistorial from '@/components/caja/caja-historial';

export default function CajaPage() {
  const { user, loading, error: authError, hasRole, signOut } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [suggestedAttendees, setSuggestedAttendees] = useState<Attendee[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (!hasRole('admin')) {
        toast.error('No tienes permisos de administrador');
        router.push('/');
      }
    }
  }, [user, loading, hasRole, router]);

  const handleSearch = async () => {
    setLoadingSearch(true);
    setError('');
    setAttendee(null);
    setSuggestedAttendees([]);

    try {
      const query = supabase.from('attendees');
      let data, error;

      if (/^\d+$/.test(search.trim())) {
        ({ data, error } = await query.select('*').eq('attendance_number', Number(search.trim())).single());

        if (data) {
          setAttendee(data);
        } else {
          setError('No se encontró ningún asistente con ese número.');
        }
      } else {
        const result = await query
          .select('*')
          .or(`firstname.ilike.%${search.trim()}%,lastname.ilike.%${search.trim()}%`);

        if (result.error) {
          setError('Error en la búsqueda.');
        } else if (result.data.length === 0) {
          setError('No se encontraron coincidencias.');
        } else if (result.data.length === 1) {
          setAttendee(result.data[0]);
        } else {
          setSuggestedAttendees(result.data);
        }
      }
    } catch (e) {
      setError('Error inesperado al buscar asistente.');
    }

    setLoadingSearch(false);
  };

  const handlePagoCompleto = async () => {
    if (!attendee) return;
    const total = attendee.expectedamount || 900;
    const anterior = attendee.paymentamount || 0;

    const { error: updateError } = await supabase
      .from('attendees')
      .update({
        paymentstatus: 'Pagado',
        paymentamount: total,
      })
      .eq('id', attendee.id);

    if (!updateError) {
      await supabase.from('caja_log').insert({
        attendee_id: attendee.id,
        nombre: `${attendee.firstname} ${attendee.lastname}`,
        monto_anterior: anterior,
        monto_actual: total,
        motivo: 'Pago completo',
        modificado_por: user?.email || 'Caja',
      });

      toast.success('Pago actualizado correctamente');
      setAttendee({ ...attendee, paymentstatus: 'Pagado', paymentamount: total });
    } else {
      toast.error('Error al actualizar el pago.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-r-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-muted-foreground">Cargando...</p>
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={signOut}
                className="text-sm"
              >
                Forzar cierre de sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass border rounded-lg shadow p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6">Iniciar sesión - Caja</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{authError}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Solo admins pueden ver el contenido
  if (!hasRole('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-try">
      <Navbar showInternalLinks={true} />
      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">Caja - Buscar Asistentes</h1>

          <div className="mb-6 flex gap-2">
            <Input
  placeholder="Nombre o número de asistente..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }}
  className="flex-1"
/>
            <Button onClick={handleSearch} disabled={loadingSearch}>
              Buscar
            </Button>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {/* Sugerencias */}
          {suggestedAttendees.length > 1 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Se encontraron varios asistentes. Selecciona uno:
              </p>
              <ul className="space-y-2">
                {suggestedAttendees.map((a) => (
                  <li
                    key={a.id}
                    className="card-glass p-3 border rounded-lg cursor-pointer hover:bg-transparent transition-colors"
                    onClick={() => {
                      setAttendee(a);
                      setSuggestedAttendees([]);
                      setSearch('');
                    }}
                  >
                    <div className="font-semibold text-primary">{a.firstname} {a.lastname} — #{a.attendance_number}</div>
                    <div className="text-xs text-muted-foreground text-white">{a.email}</div>
                    <div className="text-xs text-muted-foreground text-white">Iglesia: {a.church}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultado exacto */}
          {attendee && (
            <div className="card-glass rounded-xl shadow-md p-6 space-y-4 border border-border">
              <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                {attendee.firstname} {attendee.lastname}
                  <span className="px-2 py-0.5 bg-blue-400/50 text-black text-xs rounded-full font-mono">
                    #{attendee.attendance_number} 
                  </span>  
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Nombre:</span> {attendee.firstname} {attendee.lastname}</div>
                <div><span className="font-medium">Correo:</span> {attendee.email}</div>
                <div><span className="font-medium">Iglesia:</span> {attendee.church}</div>
                <div><span className="font-medium">Sector:</span> {attendee.sector}</div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                    attendee.paymentstatus === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {attendee.paymentstatus}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Talla:</span>{' '}
                  <span className={
                    attendee.tshirtsize
                      ? "inline-block px-2 py-1 rounded-full text-xs font-bold bg-purple-400 text-purple-900 dark:bg-purple-900 dark:text-purple-300"
                      : "inline-block px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }>
                    {attendee.tshirtsize ? attendee.tshirtsize : 'N/A'}
                  </span>
                </div>
                <div><span className="font-medium">Monto pagado:</span> ${attendee.paymentamount || 0}</div>
                <div><span className="font-medium">Total a pagar:</span> ${attendee.expectedamount || 900}</div>
                <div><span className="font-medium text-red-600">Debe:</span> ${(attendee.expectedamount || 900) - (attendee.paymentamount || 0)}</div>
              </div>

              {attendee.paymentstatus !== 'Pagado' && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePagoCompleto}>
                  Marcar como pagado
                </Button>
              )}
            </div>
          )}

          {/* Historial de pagos */}
          <CajaHistorial />
        </div>
      </div>
    </div>
  );
}