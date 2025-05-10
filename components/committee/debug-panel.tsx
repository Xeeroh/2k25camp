"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

interface DebugPanelProps {
  qrData: string | null;
  attendeeData: any | null;
}

export default function DebugPanel({ qrData, attendeeData }: DebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Añadir un log cuando cambia qrData o attendeeData
  useEffect(() => {
    if (qrData) {
      addLog('Código QR escaneado: ' + (qrData.length > 30 ? qrData.substring(0, 30) + '...' : qrData), 'info');
      
      // Intentar analizar si es un JSON
      try {
        const parsed = JSON.parse(qrData);
        addLog('QR contiene un objeto JSON válido con ID: ' + (parsed.id || 'No encontrado'), 'success');
      } catch (e) {
        // Buscar un UUID en el texto
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const matches = qrData.match(uuidRegex);
        if (matches && matches[0]) {
          addLog('Se encontró un UUID en el QR: ' + matches[0], 'success');
        } else {
          addLog('QR no es un JSON válido y no contiene un UUID reconocible', 'warning');
        }
      }
    }
  }, [qrData]);

  useEffect(() => {
    if (attendeeData) {
      addLog('Datos de asistente recibidos', 'success');
      if (attendeeData.firstname && attendeeData.lastname) {
        addLog(`Nombre: ${attendeeData.firstname} ${attendeeData.lastname}`, 'info');
      } else {
        addLog('Advertencia: Datos de nombre incompletos', 'warning');
      }
      if (attendeeData.email) {
        addLog(`Email: ${attendeeData.email}`, 'info');
      } else {
        addLog('Advertencia: Email no disponible', 'warning');
      }
    } else if (qrData) {
      addLog('No se encontraron datos de asistente para el QR escaneado', 'error');
    }
  }, [attendeeData]);

  // Función para añadir un nuevo log
  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  };

  // Función para limpiar logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Mapeo de iconos según el tipo de log
  const getIcon = (type: string) => {
    switch(type) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Colores según el tipo de log
  const getBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch(type) {
      case 'info': return 'secondary';
      case 'error': return 'destructive';
      case 'success': return 'default';
      case 'warning': return 'outline';
      default: return 'default';
    }
  };

  if (!expanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-2 flex items-center gap-1"
        onClick={() => setExpanded(true)}
      >
        <Bug className="h-4 w-4" />
        <span>Mostrar Panel de Depuración</span>
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Panel de Depuración
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearLogs}>Limpiar</Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>Cerrar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 p-3 rounded-md">
              <h3 className="text-sm font-medium mb-1">Datos del QR</h3>
              <p className="text-xs break-all">
                {qrData || 'No hay datos de QR'}
              </p>
            </div>
            <div className="bg-muted/30 p-3 rounded-md">
              <h3 className="text-sm font-medium mb-1">Estado de Asistente</h3>
              <p className="text-xs">
                {attendeeData ? 'Encontrado' : 'No encontrado'}
              </p>
              {attendeeData && (
                <div className="mt-1">
                  <Badge variant={attendeeData.paymentstatus?.toLowerCase().includes('pagado') ? 'default' : 'outline'}>
                    {attendeeData.paymentstatus || 'Estado no disponible'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-4 space-y-2">
              {logs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No hay registros</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant={getBadgeVariant(log.type)} className="flex items-center gap-1 w-20 justify-center">
                      {getIcon(log.type)}
                      <span>
                        {{
                          'info': 'Info',
                          'error': 'Error',
                          'success': 'Éxito',
                          'warning': 'Alerta'
                        }[log.type]}
                      </span>
                    </Badge>
                    <div>
                      <div className="text-muted-foreground text-xs">
                        {log.timestamp.toLocaleTimeString()}
                      </div>
                      <div>{log.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
} 