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
import { Search, CheckCircle2, XCircle, MoreHorizontal, Loader2, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Attendee;
    direction: 'asc' | 'desc';
  }>({
    key: 'registrationdate',
    direction: 'desc'
  });
  const { registerRefreshCallback, refreshAll } = useRefresh();

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
      
      // Actualizar la tabla y todas las estadísticas
      await Promise.all([
        fetchAttendees(),
        refreshAll()
      ]);
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

  const handleUpdateAttendee = async (updatedAttendee: any) => {
    try {
      if (!updatedAttendee.id) {
        throw new Error('ID del asistente no proporcionado');
      }

      // Validar el estado de pago
      const validPaymentStatus = ['Pendiente', 'Pagado', 'Revisado'] as const;
      const paymentStatus = String(updatedAttendee.paymentstatus || '').trim();
      
      if (!paymentStatus || !validPaymentStatus.includes(paymentStatus as typeof validPaymentStatus[number])) {
        throw new Error(`Estado de pago no válido. Debe ser uno de: ${validPaymentStatus.join(', ')}`);
      }

      // Si se está confirmando la asistencia y no tiene número, asignar el siguiente
      if (updatedAttendee.attendance_confirmed && !updatedAttendee.attendance_number) {
        try {
          const nextNumber = await getNextAttendanceNumber();
          updatedAttendee.attendance_number = nextNumber;
          updatedAttendee.attendance_confirmed_at = new Date().toISOString();
        } catch (error) {
          console.error('Error al asignar número de asistencia:', error);
          throw new Error('No se pudo asignar el número de asistencia');
        }
      }

      const updateData = {
        firstname: String(updatedAttendee.firstname || '').trim(),
        lastname: String(updatedAttendee.lastname || '').trim(),
        email: String(updatedAttendee.email || '').trim(),
        church: String(updatedAttendee.church || '').trim(),
        sector: String(updatedAttendee.sector || '').trim(),
        paymentamount: Number(updatedAttendee.paymentamount) || 0,
        paymentstatus: paymentStatus,
        attendance_number: updatedAttendee.attendance_number,
        attendance_confirmed: updatedAttendee.attendance_confirmed,
        attendance_confirmed_at: updatedAttendee.attendance_confirmed_at,
        tshirtsize: String(updatedAttendee.tshirtsize || '').trim()
      };

      const { error: updateError } = await supabase
        .from('attendees')
        .update(updateData)
        .eq('id', updatedAttendee.id);

      if (updateError) {
        console.error('Error de Supabase:', updateError);
        throw new Error(`Error al actualizar en la base de datos: ${updateError.message}`);
      }

      toast.success("Asistente actualizado", {
        description: "La información del asistente ha sido actualizada con éxito",
      });

      await Promise.all([
        fetchAttendees(),
        refreshAll()
      ]);
      
      closeModal();
    } catch (error) {
      console.error('Error al actualizar asistente:', error);
      toast.error("Error al actualizar", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el asistente",
      });
      throw error;
    }
  };

  const handleSort = (key: keyof Attendee) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedAttendees = (attendees: Attendee[]) => {
    return [...attendees].sort((a, b) => {
      if (sortConfig.key === 'attendance_number') {
        // Manejar números de asistencia (incluyendo undefined)
        const aNum = a.attendance_number ?? Infinity;
        const bNum = b.attendance_number ?? Infinity;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (sortConfig.key === 'registrationdate') {
        // Ordenar por fecha
        const dateA = new Date(a.registrationdate).getTime();
        const dateB = new Date(b.registrationdate).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Ordenamiento por texto
      const aValue = String(a[sortConfig.key] ?? '').toLowerCase();
      const bValue = String(b[sortConfig.key] ?? '').toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredAndSortedAttendees = getSortedAttendees(
    attendees.filter(attendee => {
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
    })
  );

  const getPaymentBadge = (status: Attendee['paymentstatus']) => {
    const getBadgeStyles = (status: Attendee['paymentstatus']) => {
      switch (status) {
        case 'Pagado':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Revisado':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        default:
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      }
    };

    const getIcon = (status: Attendee['paymentstatus']) => {
      switch (status) {
        case 'Pagado':
        case 'Revisado':
          return <CheckCircle2 className="h-3 w-3 mr-1" />;
        default:
          return <XCircle className="h-3 w-3 mr-1" />;
      }
    };

    return (
      <Badge 
        variant={status === 'Pagado' ? 'default' : 'secondary'}
        className={getBadgeStyles(status)}
      >
        {getIcon(status)}
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
            {filteredAndSortedAttendees.length === 0 && !loading ? (
              <p className="text-center text-muted-foreground">No se encontraron asistentes</p>
            ) : (
              filteredAndSortedAttendees.map((attendee) => (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('attendance_number')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Número
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('firstname')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Nombre
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('email')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Correo
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('church')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Iglesia
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('sector')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Sector
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('paymentamount')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Monto
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('paymentstatus')}
                    className="flex items-center justify-center gap-1 w-full"
                  >
                    Estado
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[60px] text-center">Comp.</TableHead>
                <TableHead className="w-[60px] text-center">Acc.</TableHead>
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
              ) : filteredAndSortedAttendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron asistentes
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="text-center">
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
                    <TableCell className="text-center">{`${attendee.firstname} ${attendee.lastname}`}</TableCell>
                    <TableCell className="text-center">{attendee.email}</TableCell>
                    <TableCell className="text-center">{attendee.church}</TableCell>
                    <TableCell className="text-center">{attendee.sector}</TableCell>
                    <TableCell className="text-center">${attendee.paymentamount}</TableCell>
                    <TableCell className="text-center">{getPaymentBadge(attendee.paymentstatus)}</TableCell>
                    <TableCell className="w-[60px] text-center">
                      {attendee.paymentreceipturl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(attendee, 'receipt')}
                          className="h-8 w-8 p-0 mx-auto"
                        >
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="w-[60px] text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 mx-auto">
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
        <AlertDialogContent className='card-glass'>
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
            <AlertDialogCancel className='text-black '>
              Cancelar
              </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
