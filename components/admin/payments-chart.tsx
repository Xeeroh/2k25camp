"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Datos de prueba simplificados
const paymentsByDate = [
  { date: '10/05', amount: 5250, count: 15 },
  { date: '11/05', amount: 7000, count: 20 },
  { date: '12/05', amount: 10500, count: 30 },
  { date: '13/05', amount: 14000, count: 40 },
  { date: '14/05', amount: 12250, count: 35 },
  { date: '15/05', amount: 17500, count: 50 },
  { date: '16/05', amount: 9100, count: 26 }
];

const paymentsBySector = [
  { name: 'Sector 1', value: 43, amount: 15050 },
  { name: 'Sector 2', value: 38, amount: 13300 },
  { name: 'Sector 3', value: 52, amount: 18200 },
  { name: 'Sector 4', value: 47, amount: 16450 },
  { name: 'Sector 5', value: 23, amount: 8050 },
  { name: 'Foráneo', value: 13, amount: 4550 }
];

const paymentStatusData = [
  { name: 'Pagado', value: 184 },
  { name: 'Pendiente', value: 32 }
];

export default function PaymentsChart() {
  const [timeframe, setTimeframe] = useState('week');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Análisis de Pagos</h2>
        
        <Select defaultValue={timeframe} onValueChange={setTimeframe}>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagos por Fecha</CardTitle>
            <CardDescription>
              Montos recaudados durante el periodo seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Gráfico de pagos por fecha deshabilitado temporalmente.
                <br />
                Estamos trabajando para resolver un problema con la visualización.
              </p>
            </div>
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
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Gráfico de distribución por sector deshabilitado temporalmente.
                    <br />
                    Estamos trabajando para resolver un problema con la visualización.
                  </p>
                </div>
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
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Gráfico de estado de pagos deshabilitado temporalmente.
                    <br />
                    Estamos trabajando para resolver un problema con la visualización.
                  </p>
                </div>
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
        </CardContent>
      </Card>
    </div>
  );
}