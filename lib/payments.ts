import { supabase } from './supabase';

// Tipos exportados
export interface PaymentByDate {
  date: string;
  amount: number;
  count: number;
}

export interface PaymentBySector {
  name: string;
  value: number;
  amount: number;
}

export interface PaymentStatus {
  name: string;
  value: number;
}

// Obtener pagos agrupados por fecha
export async function getPaymentsByDate(period: 'week' | 'month' | 'year'): Promise<PaymentByDate[]> {
  let fromDate = new Date();
  
  // Calcular fecha de inicio según el periodo
  switch (period) {
    case 'week':
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case 'month':
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case 'year':
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
  }

  const { data, error } = await supabase
    .from('attendees')
    .select('registrationdate, paymentamount, paymentstatus')
    .gte('registrationdate', fromDate.toISOString())
    .eq('paymentstatus', 'Pagado');

  if (error) {
    console.error('Error al obtener pagos por fecha:', error);
    return [];
  }

  // Agrupar por fecha
  const paymentsMap = new Map<string, { amount: number; count: number }>();
  
  data.forEach((attendee: any) => {
    const date = new Date(attendee.registrationdate).toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    if (!paymentsMap.has(date)) {
      paymentsMap.set(date, { amount: 0, count: 0 });
    }
    
    const current = paymentsMap.get(date)!;
    paymentsMap.set(date, {
      amount: current.amount + attendee.paymentamount,
      count: current.count + 1
    });
  });

  // Convertir a array y ordenar por fecha
  return Array.from(paymentsMap.entries())
    .map(([date, { amount, count }]) => ({ date, amount, count }))
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });
}

// Obtener pagos agrupados por sector
export async function getPaymentsBySector(): Promise<PaymentBySector[]> {
  const { data, error } = await supabase
    .from('attendees')
    .select('sector, paymentamount, paymentstatus');

  if (error) {
    console.error('Error al obtener pagos por sector:', error);
    return [];
  }

  const sectorMap = new Map<string, { value: number; amount: number }>();
  
  data.forEach((attendee: any) => {
    if (!sectorMap.has(attendee.sector)) {
      sectorMap.set(attendee.sector, { value: 0, amount: 0 });
    }
    
    const current = sectorMap.get(attendee.sector)!;
    
    sectorMap.set(attendee.sector, {
      value: current.value + 1,
      amount: attendee.paymentstatus === 'Pagado' 
        ? current.amount + attendee.paymentamount 
        : current.amount
    });
  });

  // Convertir a array
  return Array.from(sectorMap.entries())
    .map(([name, { value, amount }]) => ({ name, value, amount }))
    .sort((a, b) => b.value - a.value);
}

// Obtener estadísticas de estado de pagos
export async function getPaymentStatus(): Promise<PaymentStatus[]> {
  const { data, error } = await supabase
    .from('attendees')
    .select('paymentstatus')
    .not('istest', 'eq', true);

  if (error) {
    console.error('Error al obtener estado de pagos:', error);
    return [];
  }

  const statusCount = {
    Pagado: 0,
    Pendiente: 0
  };

  data.forEach((attendee: any) => {
    if (attendee.paymentstatus === 'Pagado') {
      statusCount.Pagado += 1;
    } else {
      statusCount.Pendiente += 1;
    }
  });

  return [
    { name: 'Pagado', value: statusCount.Pagado },
    { name: 'Pendiente', value: statusCount.Pendiente }
  ];
} 