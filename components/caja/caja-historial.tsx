'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
        .limit(15); // mostrar los últimos 15 pagos

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4 text-center">Historial reciente de pagos</h2>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-center">No hay movimientos recientes.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-4 shadow-sm border border-border">
              <div className="font-semibold text-primary">{log.nombre}</div>
              <div className="text-sm text-muted-foreground">Modificado por: {log.modificado_por}</div>
              <div className="text-sm text-muted-foreground">Motivo: {log.motivo}</div>
              <div className="text-sm">
                <span className="font-medium">Monto anterior:</span> ${log.monto_anterior.toFixed(2)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Monto actualizado:</span> ${log.monto_actual.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(log.fecha).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
