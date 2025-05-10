"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Input } from '@/components/ui/input';
import AttendeeInfo from '@/components/committee/attendee-info';
import { toast } from 'sonner';

export default function TestIDPage() {
  const [testId, setTestId] = useState<string>('');
  const [attendee, setAttendee] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = async () => {
    if (!testId || testId.trim() === '') {
      toast.error('Por favor ingrese un ID para buscar');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', testId.trim())
        .single();
      
      if (error) {
        console.error('Error al buscar ID:', error);
        setError(`No se encontró asistente con ID: ${testId}`);
        setAttendee(null);
      } else {
        console.log('Datos del asistente encontrado:', data);
        setAttendee(data);
        toast.success('Asistente encontrado');
      }
    } catch (err) {
      console.error('Error en la búsqueda:', err);
      setError('Error al procesar la solicitud');
      setAttendee(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Prueba de Búsqueda por ID</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ingrese un ID para buscar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={testId}
                  onChange={(e) => setTestId(e.target.value)}
                  placeholder="Ej: fa5db208-286f-4fa9-95e1-9a46295e5afb"
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
          
          {attendee && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Información del Asistente</h2>
              <AttendeeInfo attendee={attendee} />
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>IDs de Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Aquí hay algunos IDs que puede probar:</p>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-muted px-1 py-0.5 rounded">ef8a7f90-fa72-48d6-a725-80f97c6ccedc</code></li>
                <li><code className="bg-muted px-1 py-0.5 rounded">fa5db208-286f-4fa9-95e1-9a46295e5afb</code></li>
                <li><code className="bg-muted px-1 py-0.5 rounded">89eed13c-3b9c-4452-af42-bd4261c13ab2</code></li>
                <li><code className="bg-muted px-1 py-0.5 rounded">cec617b8-a6fa-47a1-b387-85123e93e811</code></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 