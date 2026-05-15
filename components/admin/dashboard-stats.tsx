"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Church, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRefresh } from './refresh-context';

export default function DashboardStats() {
  const initialStats = [
    {
      title: "Total de Asistentes",
      value: "...",
      icon: <Users className="h-5 w-5 text-blue-100/60" />,
      change: "Cargando...",
    },
    {
      title: "Total Recaudado",
      value: "...",
      icon: <DollarSign className="h-5 w-5 text-blue-100/60" />,
      change: "Cargando...",
    },
    {
      title: "Iglesias Participantes",
      value: "...",
      icon: <Church className="h-5 w-5 text-blue-100/60" />,
      change: "Cargando...",
    },
    {
      title: "Confirmados",
      value: "...",
      icon: <CheckSquare className="h-5 w-5 text-blue-100/60" />,
      change: "Cargando...",
    }
  ];
  
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerRefreshCallback } = useRefresh();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: attendees, error: attendeesError } = await supabase
        .from('attendees')
        .select('*')
        .not('istest', 'eq', true);

      if (attendeesError) throw attendeesError;

      const totalAttendees = attendees?.length || 0;
      const totalAmount = attendees?.reduce((sum, attendee) => sum + (attendee.paymentamount || 0), 0) || 0;
      const uniqueChurches = new Set(attendees?.map(a => a.church)).size;
      const confirmedAttendees = attendees?.filter(a => a.attendance_number).length || 0;

      setStats([
        {
          title: "Total de Asistentes",
          value: totalAttendees.toString(),
          icon: <Users className="h-5 w-5 text-blue-100/60" />,
          change: "Total registrados",
        },
        {
          title: "Total Recaudado",
          value: `$${totalAmount.toLocaleString()}`,
          icon: <DollarSign className="h-5 w-5 text-blue-100/60" />,
          change: "Monto total",
        },
        {
          title: "Iglesias Participantes",
          value: uniqueChurches.toString(),
          icon: <Church className="h-5 w-5 text-blue-100/60" />,
          change: "Total de iglesias",
        },
        {
          title: "Confirmados",
          value: confirmedAttendees.toString(),
          icon: <CheckSquare className="h-5 w-5 text-blue-100/60" />,
          change: "Asistentes confirmados",
        }
      ]);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registerRefreshCallback) {
      registerRefreshCallback(fetchStats);
    }
  }, [registerRefreshCallback]);

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-center text-destructive p-4 card-glass">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-glass hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 border-white/5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold tracking-widest text-blue-100/60 uppercase">
              {stat.title}
            </CardTitle>
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#f4540a]/20 transition-colors">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white tracking-tighter">
              {loading ? "..." : stat.value}
            </div>
            <p className="text-xs text-blue-100/40 mt-1 font-medium italic">
              {loading ? "Sincronizando..." : stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}