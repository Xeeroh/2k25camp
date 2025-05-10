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
import { MoreHorizontal, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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
    const formattedAttendee = {
      ...attendee,
      firstName: attendee.firstname,
      lastName: attendee.lastname,
      sector: attendee.sector,
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
      const { error } = await supabase
        .from('attendees')
        .update({
          firstname: updatedAttendee.firstName,
          lastname: updatedAttendee.lastName,
          email: updatedAttendee.email,
          sector: updatedAttendee.sector.startsWith('Sector') 
            ? updatedAttendee.sector 
            : `Sector ${updatedAttendee.sector}`,
          church: updatedAttendee.church,
          paymentamount: updatedAttendee.paymentAmount,
          paymentstatus: updatedAttendee.paymentStatus,
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
      toast.error("Error", {
        description: "No se pudo actualizar la información del asistente",
      });
    }
  };

  const filteredAttendees = attendees.filter(attendee => {
    const fullName = `${attendee.firstname} ${attendee.lastname}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      attendee.email.toLowerCase().includes(searchLower) ||
      attendee.church.toLowerCase().includes(searchLower) ||
      attendee.sector.toLowerCase().includes(searchLower)
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar asistentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Iglesia</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.map((attendee) => (
              <TableRow key={attendee.id}>
                <TableCell>{attendee.firstname} {attendee.lastname}</TableCell>
                <TableCell>{attendee.email}</TableCell>
                <TableCell>{attendee.church}</TableCell>
                <TableCell>{attendee.sector}</TableCell>
                <TableCell>${attendee.paymentamount}</TableCell>
                <TableCell>{getPaymentBadge(attendee.paymentstatus)}</TableCell>
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