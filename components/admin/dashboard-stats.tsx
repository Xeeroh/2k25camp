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
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
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

  // Función para convertir montos a números de forma segura
  const safeParseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = Number(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Función para cargar los datos de la base de datos
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Fechas para comparar con el mes anterior
      const currentDate = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(currentDate.getMonth() - 1);
      
      // 1. Obtener todos los asistentes
      const { data: totalAttendees, error: totalError } = await supabase
        .from('attendees')
        .select('id, registrationdate, paymentamount, paymentstatus, church')
        .not('istest', 'eq', true);
      
      if (totalError) throw new Error("Error al cargar asistentes");
      
      // Procesar los datos en memoria para evitar múltiples llamadas a la API
      const attendees = totalAttendees || [];
      
      // Total de asistentes
      const totalCount = attendees.length;
      const lastMonthCount = attendees.filter(a => 
        new Date(a.registrationdate) < lastMonthDate
      ).length;
      
      // Cálculo de cambio de asistentes
      const attendeeChange = lastMonthCount > 0 
        ? Math.round(((totalCount - lastMonthCount) / lastMonthCount) * 100) 
        : 0;
      
      // Procesar pagos
      const confirmedAttendees = attendees.filter(a => a.paymentstatus === 'Pagado');
      
      // Total recaudado - ahora incluye todos los pagos sin importar su estado
      const totalAmount = attendees.reduce((sum, attendee) => {
        return sum + safeParseNumber(attendee.paymentamount);
      }, 0);
      
      // Total recaudado el mes pasado - también incluye todos los pagos
      const lastMonthAmount = attendees
        .filter(a => new Date(a.registrationdate) < lastMonthDate)
        .reduce((sum, attendee) => sum + safeParseNumber(attendee.paymentamount), 0);
      
      // Cálculo de cambio en recaudación
      const amountChange = lastMonthAmount > 0 
        ? Math.round(((totalAmount - lastMonthAmount) / lastMonthAmount) * 100) 
        : 0;
      
      // Contar iglesias únicas
      const uniqueChurches = new Set(
        attendees
          .filter(a => a.church && a.church.trim() !== '')
          .map(a => a.church)
      );
      const churchCount = uniqueChurches.size;
      
      // Confirmados
      const confirmedCount = confirmedAttendees.length;
      const confirmedPercentage = totalCount > 0 
        ? Math.round((confirmedCount / totalCount) * 100) 
        : 0;
      
      // Actualizar el estado con los datos calculados
      setStats([
        {
          title: "Total de Asistentes",
          value: totalCount.toString(),
          icon: <Users className="h-5 w-5 text-muted-foreground" />,
          change: `${attendeeChange >= 0 ? '+' : ''}${attendeeChange}% respecto al mes pasado`,
          changeType: attendeeChange >= 0 ? "positive" : "negative"
        },
        {
          title: "Total Recaudado",
          value: `$${totalAmount.toLocaleString()}`,
          icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
          change: `${amountChange >= 0 ? '+' : ''}${amountChange}% respecto al mes pasado`,
          changeType: amountChange >= 0 ? "positive" : "negative"
        },
        {
          title: "Iglesias Participantes",
          value: churchCount.toString(),
          icon: <Church className="h-5 w-5 text-muted-foreground" />,
          change: `De ${CHURCHES_DATA.length} registradas`,
          changeType: "neutral"
        },
        {
          title: "Confirmados",
          value: confirmedCount.toString(),
          icon: <CheckSquare className="h-5 w-5 text-muted-foreground" />,
          change: `${confirmedPercentage}% del total`,
          changeType: "neutral"
        }
      ]);

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError("Error al cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  };

  // Registrar la función de actualización en el contexto
  useEffect(() => {
    registerRefreshCallback(loadStats);
  }, [registerRefreshCallback]);

  // Cargar datos cuando el componente se monte
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
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
              <p className={`text-xs ${
                stat.changeType === 'positive' 
                  ? 'text-green-600 dark:text-green-400' 
                  : stat.changeType === 'negative'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }`}>
                {loading ? "Cargando..." : stat.change}
              </p>
              {error && index === 0 && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}