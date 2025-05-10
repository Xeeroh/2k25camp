"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for charts
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

// Colors for charts
const SECTOR_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 
                      'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#6C3483'];
const STATUS_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))'];

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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentsByDate}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Monto ($)" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="count" name="Asistentes" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentsBySector}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentsBySector.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} asistentes`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} asistentes`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}