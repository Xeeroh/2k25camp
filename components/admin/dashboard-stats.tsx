"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Church, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CHURCHES_DATA } from '@/lib/churches-data';
import { useRefresh } from './refresh-context';

export default function DashboardStats() {
  const initialStats = [
    {
      title: "Total de Asistentes",
      value: "...",
      icon: <Users className="h-5 w-5 text-muted-foreground " />,
      change: "Cargando...",
      changeType: "neutral"
    },
    {
      title: "Total Recaudado",
      value: "...",
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
      change: "Cargando...",
      changeType: "neutral"
    },
    {
      title: "Iglesias Participantes",
      value: "...",
      icon: <Church className="h-5 w-5 text-muted-foreground" />,
      change: "Cargando...",
      changeType: "neutral"
    },
    {
      title: "Confirmados",
      value: "...",
      icon: <CheckSquare className="h-5 w-5 text-muted-foreground" />,
      change: "Cargando...",
      changeType: "neutral"
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
        .not('istest', 'eq', true); // Excluir registros de prueba

      if (attendeesError) throw attendeesError;

      const totalAttendees = attendees?.length || 0;
      const totalAmount = attendees?.reduce((sum, attendee) => sum + (attendee.paymentamount || 0), 0) || 0;
      const uniqueChurches = new Set(attendees?.map(a => a.church)).size;
      const confirmedAttendees = attendees?.filter(a => a.attendance_confirmed).length || 0;

      setStats([
        {
          title: "Total de Asistentes",
          value: totalAttendees.toString(),
          icon: <Users className="h-5 w-5 text-muted-foreground" />,
          change: "Total registrados",
          changeType: "neutral"
        },
        {
          title: "Total Recaudado",
          value: `$${totalAmount.toLocaleString()}`,
          icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
          change: "Monto total",
          changeType: "neutral"
        },
        {
          title: "Iglesias Participantes",
          value: uniqueChurches.toString(),
          icon: <Church className="h-5 w-5 text-muted-foreground" />,
          change: "Total de iglesias",
          changeType: "neutral"
        },
        {
          title: "Confirmados",
          value: confirmedAttendees.toString(),
          icon: <CheckSquare className="h-5 w-5 text-muted-foreground" />,
          change: "Asistentes confirmados",
          changeType: "neutral"
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
    registerRefreshCallback(fetchStats);
  }, [registerRefreshCallback]);

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-clear shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Cargando..." : stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}