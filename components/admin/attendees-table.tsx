"use client";

import { useIsMobile } from '@/hooks/use-is-mobile';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Attendee } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, CheckCircle2, XCircle, MoreHorizontal, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";
import AttendeeModal from "./attendee-modal";
import { useRefresh } from './refresh-context';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AttendeesTable() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { registerRefreshCallback } = useRefresh();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'receipt'>('view');

  // Mobile detection
  const isMobile = useIsMobile();

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState<Attendee | null>(null);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('registrationdate', { ascending: false });

      if (error) throw error;
      setAttendees(data || []);
    } catch (err) {
      console.error('Error al cargar asistentes:', err);
      setError('Error al cargar los asistentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerRefreshCallback(fetchAttendees);
  }, [registerRefreshCallback]);

  useEffect(() => {
    fetchAttendees();
  }, []);

  const openModal = (attendee: Attendee, mode: 'view' | 'edit' | 'receipt') => {
    let sectorValue = attendee.sector;
    if (attendee.sector.startsWith('Sector ')) {
      sectorValue = attendee.sector.replace('Sector ', '');
    }
    
    const formattedAttendee = {
      ...attendee,
      firstName: attendee.firstname,
      lastName: attendee.lastname,
      sector: sectorValue,
      church: attendee.church,
      paymentAmount: attendee.paymentamount,
      paymentStatus: attendee.paymentstatus,
      paymentReceiptUrl: attendee.paymentreceipturl,
      registrationdate: attendee.registrationdate
    };
    
    setSelectedAttendee(formattedAttendee as any);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAttendee(null);
  };

  const handleDelete = async () => {
    if (!attendeeToDelete) return;
    
    try {
      const { error } = await supabase
        .from('attendees')
        .delete()
        .eq('id', attendeeToDelete.id);
      
      if (error) throw error;
      
      toast.success("Asistente eliminado", {
        description: "El asistente ha sido eliminado con éxito",
      });
      
      fetchAttendees();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo eliminar el asistente",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAttendeeToDelete(null);
    }
  };

  const getNextAttendanceNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('attendance_number')
        .not('attendance_number', 'is', null)
        .order('attendance_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Si no hay números asignados, comenzar desde 1
      if (!data || data.length === 0) {
        return 1;
      }

      // Obtener el último número y sumar 1
      const lastNumber = data[0].attendance_number;
      return lastNumber + 1;
    } catch (error) {
      console.error('Error al obtener el siguiente número de asistencia:', error);
      throw error;
    }
  };

  const handleUpdateAttendee = async (updatedAttendee: Attendee) => {
    try {
      // Si se está confirmando la asistencia y no tiene número, asignar el siguiente
      if (updatedAttendee.attendance_confirmed && !updatedAttendee.attendance_number) {
        const nextNumber = await getNextAttendanceNumber();
        updatedAttendee.attendance_number = nextNumber;
        updatedAttendee.attendance_confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('attendees')
        .update({
          firstname: updatedAttendee.firstname,
          lastname: updatedAttendee.lastname,
          email: updatedAttendee.email,
          church: updatedAttendee.church,
          sector: updatedAttendee.sector,
          paymentamount: updatedAttendee.paymentamount,
          paymentstatus: updatedAttendee.paymentstatus,
          attendance_number: updatedAttendee.attendance_number,
          attendance_confirmed: updatedAttendee.attendance_confirmed,
          attendance_confirmed_at: updatedAttendee.attendance_confirmed_at,
          tshirtsize: updatedAttendee.tshirtsize
        })
        .eq('id', updatedAttendee.id);

      if (error) throw error;

      toast.success("Asistente actualizado", {
        description: "La información del asistente ha sido actualizada con éxito",
      });

      fetchAttendees();
      closeModal();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el asistente",
      });
    }
  };

  const filteredAttendees = attendees.filter(attendee => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${attendee.firstname} ${attendee.lastname}`.toLowerCase();
    const email = attendee.email.toLowerCase();
    const church = attendee.church.toLowerCase();
    const sector = attendee.sector.toLowerCase();
    const attendanceNumber = attendee.attendance_number?.toString().padStart(3, '0') || '';
    const attendanceNumberWithHash = `#${attendanceNumber}`;

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      church.includes(searchLower) ||
      sector.includes(searchLower) ||
      attendanceNumber.includes(searchTerm) ||
      attendanceNumberWithHash.includes(searchTerm)
    );
  });

  const getPaymentBadge = (status: Attendee['paymentstatus']) => {
    return (
      <Badge 
        variant={status === 'Pagado' ? 'default' : 'secondary'}
        className={status === 'Pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}
      >
        {status === 'Pagado' ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <XCircle className="h-3 w-3 mr-1" />
        )}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar asistentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-300 pl-8"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border max-h-[500px] overflow-y-auto">
        {isMobile ? (
          // Versión móvil: lista simplificada
          <div className="space-y-4 p-2">
            {filteredAttendees.length === 0 && !loading ? (
              <p className="text-center text-muted-foreground">No se encontraron asistentes</p>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="border rounded p-3 shadow-sm flex flex-col space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{attendee.firstname} {attendee.lastname}</span>
                    <Badge>{attendee.attendance_number ? `#${attendee.attendance_number.toString().padStart(3, '0')}` : 'Pendiente'}</Badge>
                  </div>
                  <div>Email: <span className="font-mono">{attendee.email}</span></div>
                  <div>Iglesia: {attendee.church}</div>
                  <div>Sector: {attendee.sector}</div>
                  <div>Monto: ${attendee.paymentamount}</div>
                  <div>Estado: {getPaymentBadge(attendee.paymentstatus)}</div>
                  <div className="flex space-x-2 mt-2 justify-end">
                    {attendee.paymentreceipturl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(attendee, 'receipt')}
                        className=" bg-blue h-9 px-2"
                      >
                        <ImageIcon className="h-8 w-8 text-blue-500" />
                      </Button>
                    )}
                    <Button size="sm" className='bg-blue-900/50' variant="outline" onClick={() => openModal(attendee, 'view')}>
                      Ver
                    </Button>
                    <Button size="sm" className='bg-blue-900/50' variant="outline" onClick={() => openModal(attendee, 'edit')}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setAttendeeToDelete(attendee);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Versión escritorio: tabla completa
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Iglesia</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado de Pago</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAttendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron asistentes
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      {attendee.attendance_number ? (
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary font-mono px-2 py-1"
                        >
                          #{attendee.attendance_number.toString().padStart(3, '0')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>{`${attendee.firstname} ${attendee.lastname}`}</TableCell>
                    <TableCell>{attendee.email}</TableCell>
                    <TableCell>{attendee.church}</TableCell>
                    <TableCell>{attendee.sector}</TableCell>
                    <TableCell>${attendee.paymentamount}</TableCell>
                    <TableCell>{getPaymentBadge(attendee.paymentstatus)}</TableCell>
                    <TableCell>
                      {attendee.paymentreceipturl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(attendee, 'receipt')}
                          className="h-8 px-2"
                        >
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin comprobante</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal(attendee, 'view')}>
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal(attendee, 'edit')}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setAttendeeToDelete(attendee);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedAttendee && (
        <AttendeeModal
          isOpen={isModalOpen}
          onClose={closeModal}
          attendee={selectedAttendee}
          mode={modalMode}
          onUpdate={handleUpdateAttendee}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esta eliminará permanentemente al asistente
              {attendeeToDelete && (
                <span className="font-semibold"> {attendeeToDelete.firstname} {attendeeToDelete.lastname}</span>
              )} y su información de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
