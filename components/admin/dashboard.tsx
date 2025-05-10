"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import DashboardStats from '@/components/admin/dashboard-stats';
import AttendeesTable from '@/components/admin/attendees-table';
import PaymentsChart from '@/components/admin/payments-chart';

interface DashboardProps {
  onLogout: () => Promise<void>;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
      
      <DashboardStats />
      
      <Tabs defaultValue="attendees" className="mt-8">
        <TabsList className="grid grid-cols-2 md:w-[400px] mb-8">
          <TabsTrigger value="attendees">Asistentes</TabsTrigger>
          <TabsTrigger value="payments">Pagos y Estadísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendees">
          <AttendeesTable />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentsChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}