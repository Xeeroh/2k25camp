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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-white via-white to-blue-300 bg-clip-text text-transparent tracking-tighter">
              ADMIN DASHBOARD
            </h1>
            <p className="text-blue-200/60 mt-2 font-light tracking-widest text-sm">SISTEMA CENTRAL DE CONTROL 2K26</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={onLogout}
            className="text-white hover:bg-white/10 flex items-center gap-2 border border-white/10 rounded-full px-6"
          >
            <LogOut className="h-4 w-4" />
            Cerrar panel
          </Button>
        </div>
        
        <DashboardContent />
        
        <Tabs defaultValue="attendees" className="mt-12">
          <TabsList className="grid grid-cols-3 md:w-[700px] mb-8 bg-white/5 border border-white/10 p-1.5 h-auto rounded-2xl backdrop-blur-md">
            <TabsTrigger 
              value="attendees"
              className="rounded-xl py-3 data-[state=active]:bg-[#f4540a] data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-bold tracking-tight"
            >
              ASISTENTES
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="rounded-xl py-3 data-[state=active]:bg-[#f4540a] data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-bold tracking-tight"
            >
              ESTADÍSTICAS
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="rounded-xl py-3 data-[state=active]:bg-[#f4540a] data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-bold tracking-tight"
            >
              REPORTES
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