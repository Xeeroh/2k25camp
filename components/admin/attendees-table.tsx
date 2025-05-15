"use client";

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
import { MoreHorizontal, Search, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AttendeeModal from "./attendee-modal";
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
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'receipt'>('view');
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState<Attendee | null>(null);

  useEffect(() => {
    fetchAttendees();
  }, []);

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

  const openModal = (attendee: Attendee, mode: 'view' | 'edit' | 'receipt') => {
    // Extraer el número del sector sin el prefijo
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
      
      // Refetch attendees to update the list
      fetchAttendees();
    } catch (error) {
      console.error('Error al eliminar asistente:', error);
      toast.error("Error", {
        description: "No se pudo eliminar el asistente",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAttendeeToDelete(null);
    }
  };

  const handleUpdateAttendee = async (updatedAttendee: any) => {
    try {
      if (!updatedAttendee.id) {
        throw new Error('ID del asistente es requerido');
      }
      
      // Validar campos requeridos
      const requiredFields = [
        { key: 'firstName', label: 'nombre' },
        { key: 'lastName', label: 'apellido' },
        { key: 'email', label: 'correo electrónico' },
        { key: 'sector', label: 'sector' },
        { key: 'church', label: 'iglesia' },
        { key: 'paymentAmount', label: 'monto de pago' },
        { key: 'paymentStatus', label: 'estado de pago' }
      ];
      
      for (const field of requiredFields) {
        if (updatedAttendee[field.key] === undefined || updatedAttendee[field.key] === '') {
          throw new Error(`El campo ${field.label} es requerido`);
        }
      }
      
      // Validar que el monto sea un número
      const paymentAmount = Number(updatedAttendee.paymentAmount);
      if (isNaN(paymentAmount)) {
        throw new Error(`El monto de pago debe ser un número válido`);
      }
      
      // Validar que el estado de pago sea válido
      if (!['Pendiente', 'Pagado', 'Completado'].includes(updatedAttendee.paymentStatus)) {
        throw new Error('El estado de pago debe ser "Pendiente", "Pagado" o "Completado"');
      }
      
      // Normalizar paymentStatus (Completado -> Pagado)
      const paymentStatus = updatedAttendee.paymentStatus === 'Completado' ? 'Pagado' : updatedAttendee.paymentStatus;
      
      console.log('Datos a actualizar:', {
        id: updatedAttendee.id,
        firstname: updatedAttendee.firstName,
        lastname: updatedAttendee.lastName,
        email: updatedAttendee.email,
        sector: updatedAttendee.sector === 'Foráneo' ? 'Foráneo' : updatedAttendee.sector,
        church: updatedAttendee.church,
        paymentamount: paymentAmount,
        paymentstatus: paymentStatus,
        tshirtsize: updatedAttendee.tshirtsize || null,
      });
      
      const { error } = await supabase
        .from('attendees')
        .update({
          firstname: updatedAttendee.firstName,
          lastname: updatedAttendee.lastName,
          email: updatedAttendee.email,
          sector: updatedAttendee.sector === 'Foráneo' ? 'Foráneo' : updatedAttendee.sector,
          church: updatedAttendee.church,
          paymentamount: paymentAmount,
          paymentstatus: paymentStatus,
          tshirtsize: updatedAttendee.tshirtsize || null,
        })
        .eq('id', updatedAttendee.id);

      if (error) throw error;
      
      toast.success("Asistente actualizado", {
        description: "La información del asistente ha sido actualizada con éxito",
      });
      
      // Refetch attendees to get the updated list
      fetchAttendees();
      closeModal();
    } catch (err) {
      console.error('Error al actualizar asistente:', err);
      let errorMessage = "No se pudo actualizar la información del asistente";
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  const filteredAttendees = attendees.filter(attendee => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${attendee.firstname} ${attendee.lastname}`.toLowerCase();
    const email = attendee.email.toLowerCase();
    const church = attendee.church.toLowerCase();
    const sector = attendee.sector.toLowerCase();
    const attendanceNumber = attendee.attendance_number?.toString() || '';

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      church.includes(searchLower) ||
      sector.includes(searchLower) ||
      attendanceNumber.includes(searchLower)
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
      <div className="flex justify-between items-center">
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar asistente..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={fetchAttendees}
          variant="outline"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Actualizar"
          )}
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Iglesia</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Talla</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.map((attendee) => (
              <TableRow key={attendee.id} className={attendee.istest ? "bg-gray-50" : ""}>
                <TableCell>
                  {attendee.attendance_number ? (
                    <Badge variant="outline" className="bg-green-50">
                      #{attendee.attendance_number}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>{attendee.firstname} {attendee.lastname}</TableCell>
                <TableCell>{attendee.email}</TableCell>
                <TableCell>{attendee.church}</TableCell>
                <TableCell>{attendee.sector}</TableCell>
                <TableCell>${attendee.paymentamount}</TableCell>
                <TableCell>{getPaymentBadge(attendee.paymentstatus)}</TableCell>
                <TableCell>
                  {attendee.tshirtsize ? (
                    <Badge variant="outline" className="bg-blue-50">{attendee.tshirtsize}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>{new Date(attendee.registrationdate).toLocaleDateString()}</TableCell>
                <TableCell>
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
                      {attendee.paymentreceipturl && (
                        <DropdownMenuItem onClick={() => openModal(attendee, 'receipt')}>
                          Ver comprobante
                        </DropdownMenuItem>
                      )}
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Attendee Modal */}
      {selectedAttendee && (
        <AttendeeModal
          isOpen={isModalOpen}
          onClose={closeModal}
          attendee={selectedAttendee}
          mode={modalMode}
          onUpdate={handleUpdateAttendee}
        />
      )}

      {/* Delete Confirmation Dialog */}
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