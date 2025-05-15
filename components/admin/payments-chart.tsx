"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPaymentsByDate, getPaymentsBySector, getPaymentStatus } from '@/lib/payments';
import type { PaymentByDate, PaymentBySector, PaymentStatus } from '@/lib/payments';

export default function PaymentsChart() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para almacenar los datos
  const [paymentsByDate, setPaymentsByDate] = useState<PaymentByDate[]>([]);
  const [paymentsBySector, setPaymentsBySector] = useState<PaymentBySector[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatus[]>([]);
  
  // Función para cargar los datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar datos de pagos por fecha según el período seleccionado
      const dateData = await getPaymentsByDate(timeframe);
      setPaymentsByDate(dateData);
      
      // Cargar datos por sector y estado de pago (estos no dependen del período)
      const sectorData = await getPaymentsBySector();
      const statusData = await getPaymentStatus();
      
      setPaymentsBySector(sectorData);
      setPaymentStatusData(statusData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos cuando cambie el período seleccionado
  useEffect(() => {
    loadData();
  }, [timeframe]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Análisis de Pagos</h2>
        
        <Select defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'year')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mes</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagos por Fecha</CardTitle>
            <CardDescription>
              Montos recaudados durante el periodo seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Cargando datos...</p>
              </div>
            ) : paymentsByDate.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  No hay datos disponibles para el período seleccionado.
                </p>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Gráfico de pagos por fecha deshabilitado temporalmente.
                  <br />
                  Estamos trabajando para resolver un problema con la visualización.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs defaultValue="sectors">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="sectors">Por Sector</TabsTrigger>
            <TabsTrigger value="status">Estado de Pago</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sectors">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Sector</CardTitle>
                <CardDescription>
                  Asistentes registrados por cada sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : paymentsBySector.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      No hay datos disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Gráfico de distribución por sector deshabilitado temporalmente.
                      <br />
                      Estamos trabajando para resolver un problema con la visualización.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Pagos</CardTitle>
                <CardDescription>
                  Distribución de pagos completados vs. pendientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : paymentStatusData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      No hay datos disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Gráfico de estado de pagos deshabilitado temporalmente.
                      <br />
                      Estamos trabajando para resolver un problema con la visualización.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Mostramos los datos en formato tabla como alternativa */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Datos de Pagos</CardTitle>
          <CardDescription>
            Información detallada en formato tabular
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          ) : paymentsByDate.length === 0 ? (
            <div className="py-8 flex items-center justify-center">
              <p className="text-muted-foreground">No hay datos disponibles para el período seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-right p-2">Monto ($)</th>
                    <th className="text-right p-2">Asistentes</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsByDate.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.date}</td>
                      <td className="text-right p-2">${item.amount.toLocaleString()}</td>
                      <td className="text-right p-2">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="p-2 font-bold">Total</td>
                    <td className="text-right p-2 font-bold">
                      ${paymentsByDate.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </td>
                    <td className="text-right p-2 font-bold">
                      {paymentsByDate.reduce((sum, item) => sum + item.count, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}