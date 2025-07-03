"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import DashboardStats from '@/components/admin/dashboard-stats';
import AttendeesTable from '@/components/admin/attendees-table';
import PaymentsChart from '@/components/admin/payments-chart';
import { RefreshProvider } from './refresh-context';
import { useRefresh } from './refresh-context';
import { RefreshCw } from 'lucide-react';
import DashboardReports from './dashboard-reports';

interface DashboardProps {
  onLogout: () => Promise<void>;
}

function DashboardContent() {
  const { refreshAll, isRefreshing } = useRefresh();

  const handleRefresh = async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className='bg-blue-850/50 hover:text-black hover:bg-clear'
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar todo'}
        </Button>
      </div>
      <DashboardStats />
    </div>
  );
}

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <RefreshProvider>
      <div className="bg-try max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="bg-blue-850/50 hover:text-black hover:bg-clear flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        
        <DashboardContent />
        
        <Tabs defaultValue="attendees" className="mt-8">
          <TabsList className="grid grid-cols-3 md:w-[600px] mb-8">
            <TabsTrigger 
              value="attendees"
              className="text-black data-[state=active]:bg-slate-500/80 data-[state=active]:text-slate-900"
            >
              Asistentes
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="text-black data-[state=active]:bg-slate-500/80 data-[state=active]:text-slate-900"
            >
              Pagos y Estadísticas
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="text-black data-[state=active]:bg-slate-500/80 data-[state=active]:text-slate-900"
            >
              Reportes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendees">
            <AttendeesTable />
          </TabsContent>
          
          <TabsContent value="payments">
            <PaymentsChart />
          </TabsContent>

          <TabsContent value="reports">
            <DashboardReports />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshProvider>
  );
}