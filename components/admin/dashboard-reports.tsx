"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Download, Users, DollarSign, Church, MapPin, Hash, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("attendees")
        .select("*")
        .not("istest", "eq", true);
      if (error) {
        setError("Error al cargar los datos");
        setLoading(false);
        return;
      }
      setAttendees(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  // Reportes
  const totalRegistrados = attendees.length;
  // Por método de registro (si existe campo, si no, muestra N/A)
  const porMetodo = attendees.reduce(
    (acc, curr) => {
      const metodo = curr.metodo_registro || curr.notes || "N/A";
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  // Asistencia
  const totalAsistieron = attendees.filter(a => a.attendance_confirmed).length;
  // Pagos
  const totalRecaudado = attendees.reduce((sum, a) => sum + (a.paymentamount || 0), 0);
  // Por iglesia
  const porIglesia = attendees.reduce((acc, curr) => {
    const iglesia = curr.church || "Sin iglesia";
    acc[iglesia] = (acc[iglesia] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // Por sector
  const porSector = attendees.reduce((acc, curr) => {
    const sector = curr.sector || "Sin sector";
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // Lista de campistas
  const listaCampistas = attendees.map(a => ({
    numero: a.attendance_number,
    nombre: `${a.firstname} ${a.lastname}`,
    rol: a.notes || "-"
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <Card className="card-clear border-red-500">
      <CardContent className="p-6">
        <div className="text-red-400 text-center">{error}</div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="grid grid-cols-4 w-full mb-8 bg-gray-800/50">
        <TabsTrigger 
          value="resumen"
          className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Resumen
        </TabsTrigger>
        <TabsTrigger 
          value="iglesia"
          className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
        >
          <Church className="h-4 w-4 mr-2" />
          Por Iglesia
        </TabsTrigger>
        <TabsTrigger 
          value="sector"
          className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Por Sector
        </TabsTrigger>
        <TabsTrigger 
          value="campistas"
          className="text-white data-[state=active]:bg-blue-600/80 data-[state=active]:text-white"
        >
          <Hash className="h-4 w-4 mr-2" />
          Campistas
        </TabsTrigger>
      </TabsList>

      {/* Tab Resumen */}
      <TabsContent value="resumen" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-900/50 to-blue-800/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Registrados
              </CardTitle>
              <Users className="h-5 w-5 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRegistrados}</div>
              <p className="text-xs text-blue-200">Registros totales</p>
            </CardContent>
          </Card>

          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-900/50 to-green-800/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Asistencia Confirmada
              </CardTitle>
              <Users className="h-5 w-5 text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalAsistieron}</div>
              <p className="text-xs text-green-200">Asistentes confirmados</p>
            </CardContent>
          </Card>

          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Recaudado
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalRecaudado.toLocaleString()}</div>
              <p className="text-xs text-yellow-200">Monto total</p>
            </CardContent>
          </Card>

          <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-900/50 to-purple-800/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Iglesias Participantes
              </CardTitle>
              <Church className="h-5 w-5 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{Object.keys(porIglesia).length}</div>
              <p className="text-xs text-purple-200">Total de iglesias</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Tab Por Iglesia */}
      <TabsContent value="iglesia">
        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Church className="h-6 w-6 text-blue-400" />
              <CardTitle className="text-xl font-bold text-white">Registrados por Iglesia</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-850/50 hover:text-black hover:bg-clear border-blue-400/30"
              onClick={() => {
                const data = Object.entries(porIglesia).map(([iglesia, count]) => ({
                  iglesia,
                  cantidad: count
                }));
                downloadCSV(data, ['Iglesia', 'Cantidad'], 'registrados_por_iglesia.csv');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Iglesia</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(porIglesia) as [string, number][]).map(([iglesia, count], index) => (
                    <tr key={iglesia} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                      <td className="py-3 px-4 text-white">{iglesia}</td>
                      <td className="py-3 px-4 text-blue-300 font-semibold">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Por Sector */}
      <TabsContent value="sector">
        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-green-400" />
              <CardTitle className="text-xl font-bold text-white">Registrados por Sector</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-850/50 hover:text-black hover:bg-clear border-green-400/30"
              onClick={() => {
                const data = Object.entries(porSector).map(([sector, count]) => ({
                  sector,
                  cantidad: count
                }));
                downloadCSV(data, ['Sector', 'Cantidad'], 'registrados_por_sector.csv');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Sector</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(porSector) as [string, number][]).map(([sector, count], index) => (
                    <tr key={sector} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                      <td className="py-3 px-4 text-white">{sector}</td>
                      <td className="py-3 px-4 text-green-300 font-semibold">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Lista de Campistas */}
      <TabsContent value="campistas">
        <Card className="card-clear shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hash className="h-6 w-6 text-purple-400" />
              <CardTitle className="text-xl font-bold text-white">Números de Campistas Asignados</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-850/50 hover:text-black hover:bg-clear border-purple-400/30"
              onClick={() => {
                downloadCSV(listaCampistas, ['Número', 'Nombre', 'Rol'], 'lista_campistas.csv');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Número</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCampistas.map((c, i) => (
                    <tr key={i} className={`border-b border-gray-700/50 ${i % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-gray-700/30 transition-colors`}>
                      <td className="py-3 px-4 text-purple-300 font-semibold">{c.numero}</td>
                      <td className="py-3 px-4 text-white">{c.nombre}</td>
                      <td className="py-3 px-4 text-gray-300">{c.rol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 