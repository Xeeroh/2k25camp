"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, DollarSign, TrendingUp, Users } from 'lucide-react';
import { getPaymentsByDate, getPaymentsBySector, getPaymentStatus } from '@/lib/payments';
import type { PaymentByDate, PaymentBySector, PaymentStatus } from '@/lib/payments';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PaymentsChart() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para almacenar los datos
  const [paymentsByDate, setPaymentsByDate] = useState<PaymentByDate[]>([]);
  const [paymentsBySector, setPaymentsBySector] = useState<PaymentBySector[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatus[]>([]);
  
  // Función para convertir datos a CSV
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || '';
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');
    return csvContent;
  };

  // Función para descargar CSV
  const downloadCSV = (data: any[], headers: string[], filename: string) => {
    const csv = convertToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Configuración de la gráfica de dona para sectores
  const sectorChartData = {
    labels: paymentsBySector.map(item => item.name),
    datasets: [
      {
        data: paymentsBySector.map(item => item.value),
        backgroundColor: [
          '#3B82F6', // blue-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#EF4444', // red-500
          '#8B5CF6', // violet-500
          '#06B6D4', // cyan-500
          '#84CC16', // lime-500
          '#F97316', // orange-500
          '#EC4899', // pink-500
          '#6366F1', // indigo-500
        ],
        borderColor: [
          '#1E40AF', // blue-700
          '#047857', // emerald-700
          '#D97706', // amber-700
          '#DC2626', // red-700
          '#7C3AED', // violet-700
          '#0891B2', // cyan-700
          '#65A30D', // lime-700
          '#EA580C', // orange-700
          '#BE185D', // pink-700
          '#4338CA', // indigo-700
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const sectorChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} asistentes (${percentage}%)`;
          },
        },
      },
    },
  };
  
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

  // Calcular totales
  const totalAmount = paymentsByDate.reduce((sum, item) => sum + item.amount, 0);
  const totalAttendees = paymentsByDate.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Análisis de Pagos</h2>
        </div>
        
        <Select defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'year')}>
          <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-600 text-white">
            <SelectValue placeholder="Seleccionar periodo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="week" className="text-white hover:bg-gray-700">Última Semana</SelectItem>
            <SelectItem value="month" className="text-white hover:bg-gray-700">Último Mes</SelectItem>
            <SelectItem value="year" className="text-white hover:bg-gray-700">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {error && (
        <Card className="card-clear border-red-500">
          <CardContent className="p-4">
            <div className="text-red-400 text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-900/50 to-green-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Recaudado
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-green-200">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-900/50 to-blue-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Asistentes Pagados
            </CardTitle>
            <Users className="h-5 w-5 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAttendees}</div>
            <p className="text-xs text-blue-200">Con pago confirmado</p>
          </CardContent>
        </Card>

        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-900/50 to-purple-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Promedio por Persona
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${totalAttendees > 0 ? (totalAmount / totalAttendees).toFixed(0) : 0}
            </div>
            <p className="text-xs text-purple-200">Monto promedio</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="fecha" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-8 bg-gray-800/50">
          <TabsTrigger 
            value="fecha"
            className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Por Fecha
          </TabsTrigger>
          <TabsTrigger 
            value="sector"
            className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Por Sector
          </TabsTrigger>
          <TabsTrigger 
            value="estado"
            className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Estado
          </TabsTrigger>
        </TabsList>

        {/* Tab Pagos por Fecha */}
        <TabsContent value="fecha">
          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                <CardTitle className="text-xl font-bold text-white">Pagos por Fecha</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-850/50 hover:text-black hover:bg-clear border-green-400/30"
                onClick={() => {
                  const data = paymentsByDate.map(item => ({
                    fecha: item.date,
                    monto: item.amount,
                    asistentes: item.count
                  }));
                  downloadCSV(data, ['Fecha', 'Monto', 'Asistentes'], `pagos_por_fecha_${timeframe}.csv`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : paymentsByDate.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    No hay datos disponibles para el período seleccionado.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Fecha</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-300">Monto ($)</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-300">Asistentes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsByDate.map((item, index) => (
                        <tr key={index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                          <td className="py-3 px-4 text-white">{item.date}</td>
                          <td className="text-right py-3 px-4 text-green-300 font-semibold">${item.amount.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-blue-300 font-semibold">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-600 bg-gray-800/30">
                        <td className="py-3 px-4 font-bold text-white">Total</td>
                        <td className="text-right py-3 px-4 font-bold text-green-300">${totalAmount.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-bold text-blue-300">{totalAttendees}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Por Sector */}
        <TabsContent value="sector">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica */}
            <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-xl font-bold text-white">Distribución por Sector</CardTitle>
                </div>
                <CardDescription className="text-gray-300">
                  Gráfica de asistentes registrados por cada sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : paymentsBySector.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-400 text-center">
                      No hay datos disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <Doughnut data={sectorChartData} options={sectorChartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla */}
            <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-xl font-bold text-white">Detalle por Sector</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-850/50 hover:text-black hover:bg-clear border-blue-400/30"
                  onClick={() => {
                    const data = paymentsBySector.map(item => ({
                      sector: item.name,
                      asistentes: item.value,
                      monto: item.amount
                    }));
                    downloadCSV(data, ['Sector', 'Asistentes', 'Monto'], 'distribucion_por_sector.csv');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : paymentsBySector.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-400 text-center">
                      No hay datos disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 px-4 font-semibold text-gray-300">Sector</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-300">Asistentes</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-300">Monto ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsBySector.map((item, index) => (
                          <tr key={index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                            <td className="py-3 px-4 text-white">{item.name}</td>
                            <td className="text-right py-3 px-4 text-blue-300 font-semibold">{item.value}</td>
                            <td className="text-right py-3 px-4 text-green-300 font-semibold">${item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Estado de Pagos */}
        <TabsContent value="estado">
          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-xl font-bold text-white">Estado de Pagos</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-850/50 hover:text-black hover:bg-clear border-purple-400/30"
                onClick={() => {
                  const data = paymentStatusData.map(item => ({
                    estado: item.name,
                    cantidad: item.value
                  }));
                  downloadCSV(data, ['Estado', 'Cantidad'], 'estado_de_pagos.csv');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : paymentStatusData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    No hay datos disponibles.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Estado</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-300">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentStatusData.map((item, index) => (
                        <tr key={index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                          <td className="py-3 px-4 text-white">{item.name}</td>
                          <td className="text-right py-3 px-4 text-purple-300 font-semibold">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}