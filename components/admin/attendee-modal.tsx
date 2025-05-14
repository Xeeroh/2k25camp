"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CHURCHES_DATA } from '@/lib/churches-data';
import { Badge } from "@/components/ui/badge";

// Form schema for editing attendee
const formSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  sector: z.string(),
  church: z.string(),
  paymentAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  paymentStatus: z.string(),
  tshirtsize: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AttendeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  attendee: any;
  mode: 'view' | 'edit' | 'receipt';
  onUpdate?: (updatedAttendee: any) => Promise<void>;
};

export default function AttendeeModal({ isOpen, onClose, attendee, mode, onUpdate }: AttendeeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sectorValue, setSectorValue] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      sector: "",
      church: "",
      paymentAmount: 0,
      paymentStatus: "",
      tshirtsize: "",
    },
  });
  
  // Reset form with attendee data when attendee changes
  useEffect(() => {
    if (attendee) {
      form.reset({
        firstName: attendee.firstName || "",
        lastName: attendee.lastName || "",
        email: attendee.email || "",
        sector: attendee.sector?.replace('Sector ', '') || "",
        church: attendee.church || "",
        paymentAmount: attendee.paymentAmount || 0,
        paymentStatus: attendee.paymentStatus || "Pendiente",
        tshirtsize: attendee.tshirtsize || "",
      });
      
      if (attendee.sector) {
        setSectorValue(attendee.sector.replace('Sector ', ''));
      }
    }
  }, [attendee, form]);
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (mode !== 'edit' || !onUpdate) return;
    
    setIsLoading(true);
    
    try {
      const updatedAttendee = {
        ...attendee,
        ...data,
      };
      
      await onUpdate(updatedAttendee);
    } catch (error) {
      console.error("Error al actualizar:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter churches based on selected sector
  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sectorValue || 
              (sectorValue === "Foráneo" && church.sector === "Foráneo")
  );
  
  // Format date to locale string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get modal title based on mode
  const getModalTitle = () => {
    if (mode === 'view') return "Detalles del Asistente";
    if (mode === 'edit') return "Editar Asistente";
    if (mode === 'receipt') return "Comprobante de Pago";
    return "Asistente";
  };

  const renderContent = () => {
    switch (mode) {
      case 'view':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Nombre</h4>
                <p>{attendee.firstName} {attendee.lastName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p>{attendee.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Iglesia</h4>
                <p>{attendee.church}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sector</h4>
                <p>{attendee.sector}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Monto</h4>
                <p>${attendee.paymentAmount}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Estado de Pago</h4>
                <Badge 
                  variant={attendee.paymentStatus === 'Completado' ? 'success' : 'warning'}
                >
                  {attendee.paymentStatus}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fecha de Registro</h4>
                <p>{formatDate(attendee.registrationdate)}</p>
              </div>
              {attendee.tshirtsize && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Talla de Camiseta</h4>
                  <p>{attendee.tshirtsize}</p>
                </div>
              )}
              {attendee.istest && (
                <div>
                  <Badge variant="outline" className="bg-gray-100">Registro de prueba</Badge>
                </div>
              )}
            </div>
            {attendee.paymentReceiptUrl && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Comprobante de Pago</h4>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(attendee.paymentReceiptUrl, '_blank')}
                >
                  Ver Comprobante
                </Button>
              </div>
            )}
          </div>
        );
      
      case 'edit':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSectorValue(value);
                          form.setValue("church", ""); // Reset church when sector changes
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un sector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Sector 1</SelectItem>
                          <SelectItem value="2">Sector 2</SelectItem>
                          <SelectItem value="3">Sector 3</SelectItem>
                          <SelectItem value="4">Sector 4</SelectItem>
                          <SelectItem value="5">Sector 5</SelectItem>
                          <SelectItem value="Foráneo">Foráneo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="church"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iglesia</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto de Pago</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Pago</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tshirtsize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talla de Camiseta</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione talla" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NA">Sin asignar</SelectItem>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );
      
      case 'receipt':
        return attendee.paymentReceiptUrl ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full h-96">
              <Image 
                src={attendee.paymentReceiptUrl} 
                alt="Comprobante de pago" 
                fill
                className="object-contain"
              />
            </div>
            <Button 
              onClick={() => window.open(attendee.paymentReceiptUrl, '_blank')}
            >
              Abrir en nueva pestaña
            </Button>
          </div>
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            No hay comprobante de pago disponible.
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'view' && 'Información completa del asistente.'}
            {mode === 'edit' && 'Modifica la información del asistente.'}
            {mode === 'receipt' && 'Comprobante de pago del asistente.'}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        {mode === 'view' && (
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}