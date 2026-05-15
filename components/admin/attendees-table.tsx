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
import { Search, CheckCircle2, XCircle, MoreHorizontal, Loader2, Image as ImageIcon, ArrowUpDown, Users, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
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
      const { error, count } = await supabase
        .from('attendees')
        .delete({ count: 'exact' })
        .eq('id', attendeeToDelete.id)
        .select();

      if (error) throw error;

      if (count === 0) {
        toast.warning("Sin cambios", {
          description: "El servidor no permitió borrar este registro (revisa permisos RLS)."
        });
        return;
      }

      toast.success("Asistente eliminado", {
        description: `${attendeeToDelete.firstname} ha sido removido.`
      });

      await fetchAttendees();
      if (refreshAll) refreshAll();
      
    } catch (error: any) {
      toast.error("Error al eliminar", {
        description: error.message || "Error desconocido."
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
        tshirtsize: String(updatedAttendee.tshirtsize || '').trim(),
        notes: String(updatedAttendee.notes || '').trim()
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
          return 'bg-green-500/20 text-green-300 border-green-500/30';
        case 'Revisado':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        default:
          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
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
        variant="outline"
        className={cn("px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider", getBadgeStyles(status))}
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-100/40 group-focus-within:text-[#f4540a] transition-colors" />
          <Input
            placeholder="Buscar por nombre, correo o iglesia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border-white/10 pl-10 h-12 rounded-2xl text-blue-100 placeholder:text-blue-100/30 focus:ring-1 focus:ring-[#f4540a]/50 focus:border-[#f4540a]/50 backdrop-blur-xl transition-all"
          />
        </div>
      </div>

      <div className="rounded-md border max-h-[500px] overflow-y-auto">
        {isMobile ? (
          // Versión móvil: Tarjetas elegantes
          <div className="grid grid-cols-1 gap-4 p-4">
            {filteredAndSortedAttendees.length === 0 && !loading ? (
              <div className="text-center py-12 card-glass">
                <p className="text-blue-100/40 italic">No se encontraron asistentes</p>
              </div>
            ) : (
              filteredAndSortedAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="card-glass p-5 flex flex-col space-y-4 border-white/5 shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="h-20 w-20 text-white" />
                  </div>

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="text-xl font-bold text-white tracking-tight">
                        {attendee.firstname} {attendee.lastname}
                      </h4>
                      <p className="text-xs text-blue-100/60 font-mono mt-0.5">{attendee.email}</p>
                    </div>
                    <Badge className="bg-[#f4540a]/20 text-[#f4540a] border-0 font-black">
                      {attendee.attendance_number ? `#${attendee.attendance_number.toString().padStart(3, '0')}` : 'PEND'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Iglesia / Sector</p>
                      <p className="text-blue-100 font-medium truncate">{attendee.church}</p>
                      <p className="text-blue-100/60 text-xs">Sector {attendee.sector}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Pago / Deuda</p>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-bold">${attendee.paymentamount}</span>
                        <span className="text-white/20">|</span>
                        <span className="text-red-400 font-bold">${900 - (attendee.paymentamount || 0)}</span>
                      </div>
                      {getPaymentBadge(attendee.paymentstatus)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">
                        Talla: {attendee.tshirtsize || 'N/A'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      {attendee.paymentreceipturl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openModal(attendee, 'receipt')}
                          className="h-9 w-9 text-blue-400 hover:text-blue-300 hover:bg-white/5"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/60">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="card-glass border-white/10">
                          <DropdownMenuItem onClick={() => openModal(attendee, 'view')} className="text-white hover:bg-white/10">
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal(attendee, 'edit')} className="text-white hover:bg-white/10">
                            Editar Info
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                            onSelect={() => {
                              // Pequeño timeout para dejar que el menú cierre
                              setTimeout(() => {
                                setAttendeeToDelete(attendee);
                                setIsDeleteDialogOpen(true);
                              }, 100);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-white/5 sticky top-0 bg-blue-950 backdrop-blur-md z-20">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-center w-20 py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('attendance_number')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      ID <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('firstname')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      ASISTENTE <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('church')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      IGLESIA / SECTOR <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('tshirtsize')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      TALLA <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('paymentamount')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      PAGO <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center py-5">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('paymentstatus')}
                      className="text-blue-100/60 font-bold tracking-widest text-[10px] uppercase hover:text-white"
                    >
                      ESTADO <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right py-5 pr-8">
                    <span className="text-blue-100/40 font-bold tracking-widest text-[10px] uppercase">ACCIONES</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAttendees.map((attendee) => (
                  <TableRow key={attendee.id} className="group hover:bg-white/5 border-white/5 transition-all">
                    <TableCell className="text-center font-mono text-blue-300 py-4">
                      {attendee.attendance_number ? (
                        <span className="font-black text-[#f4540a] bg-[#f4540a]/10 px-2 py-1 rounded">
                          {attendee.attendance_number.toString().padStart(3, '0')}
                        </span>
                      ) : (
                        <span className="text-blue-100/20">---</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <p className="font-bold text-white text-base">
                          {attendee.firstname} {attendee.lastname}
                        </p>
                        <p className="text-xs text-blue-100/40">{attendee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <p className="text-blue-100 font-medium">{attendee.church}</p>
                        <p className="text-[10px] text-blue-100/40 uppercase tracking-widest font-bold">Sector {attendee.sector}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {attendee.tshirtsize && attendee.tshirtsize !== 'NA' ? (
                        <Badge className="bg-[#f4540a]/20 text-[#f4540a] border-0 font-black px-3 py-1">
                          {attendee.tshirtsize}
                        </Badge>
                      ) : (
                        <span className="text-blue-100/10 font-black">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-green-400 font-black">${attendee.paymentamount}</span>
                        <span className="text-[10px] text-red-400/50">-${900 - (attendee.paymentamount || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {getPaymentBadge(attendee.paymentstatus)}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-8">
                      <div className="flex justify-end items-center gap-2">
                        {attendee.paymentreceipturl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(attendee, 'receipt')}
                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-white/10"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 group-hover:text-white transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="card-glass border-white/10 min-w-[150px]">
                            <DropdownMenuItem onClick={() => openModal(attendee, 'view')} className="text-white hover:bg-white/10 cursor-pointer">
                              Ver Ficha
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openModal(attendee, 'edit')} className="text-white hover:bg-white/10 cursor-pointer">
                              Editar Datos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                              onSelect={() => {
                                setTimeout(() => {
                                  setAttendeeToDelete(attendee);
                                  setIsDeleteDialogOpen(true);
                                }, 100);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Borrar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}