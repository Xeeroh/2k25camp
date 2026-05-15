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
import { toast } from "sonner";
import { CheckCircle2, XCircle, Image as ImageIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Form schema for editing attendee
const formSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  sector: z.string(),
  church: z.string(),
  paymentAmount: z.number().min(0, "El monto no puede ser negativo"),
  paymentStatus: z.enum(['Pendiente', 'Pagado', 'Revisado']),
  tshirtsize: z.string().optional(),
  notes: z.string().optional(),
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
  const getPaymentBadge = (status: string) => {
    const getBadgeStyles = (status: string) => {
      switch (status) {
        case 'Pagado': return 'bg-green-500/20 text-green-300 border-green-500/30';
        case 'Revisado': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        default: return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      }
    };

    const getIcon = (status: string) => {
      switch (status) {
        case 'Pagado':
        case 'Revisado': return <CheckCircle2 className="h-3 w-3 mr-1" />;
        default: return <XCircle className="h-3 w-3 mr-1" />;
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
      paymentStatus: "Pendiente" as const,
      tshirtsize: "",
      notes: "",
    },
  });
  
  // Reset form with attendee data when attendee changes
  useEffect(() => {
    if (attendee) {
      console.log('Resetting form with attendee data:', attendee);
      form.reset({
        firstName: attendee.firstName || attendee.firstname || "",
        lastName: attendee.lastName || attendee.lastname || "",
        email: attendee.email || "",
        sector: attendee.sector || "",
        church: attendee.church || "",
        paymentAmount: Number(attendee.paymentAmount || attendee.paymentamount || 0),
        paymentStatus: (attendee.paymentStatus || attendee.paymentstatus || "Pendiente") as "Pendiente" | "Pagado" | "Revisado",
        tshirtsize: attendee.tshirtsize || "",
        notes: attendee.notes || "",
      });
      
      setSectorValue(attendee.sector || "");
    }
  }, [attendee, form]);
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (mode !== 'edit' || !onUpdate) return;
    
    setIsLoading(true);
    
    try {
      // Asegurarnos de que el estado de pago sea uno de los valores permitidos
      const validPaymentStatus = ['Pendiente', 'Pagado', 'Revisado'] as const;
      const paymentStatus = data.paymentStatus as typeof validPaymentStatus[number];
      
      if (!validPaymentStatus.includes(paymentStatus)) {
        throw new Error(`Estado de pago no válido. Debe ser uno de: ${validPaymentStatus.join(', ')}`);
      }

      const updatedAttendee = {
        ...attendee,
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.email,
        church: data.church,
        sector: data.sector,
        paymentamount: data.paymentAmount,
        paymentstatus: paymentStatus,
        tshirtsize: data.tshirtsize,
        notes: data.notes,
        id: attendee.id
      };
      
      console.log('Enviando datos para actualizar:', updatedAttendee);
      await onUpdate(updatedAttendee);
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el asistente",
      });
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
          <div className="space-y-6">
            {/* Header de la Ficha */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#f4540a] to-orange-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-orange-950/40">
                {attendee.firstName?.charAt(0)}{attendee.lastName?.charAt(0)}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white tracking-tight">
                  {attendee.firstName} {attendee.lastName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-[#f4540a]/20 text-[#f4540a] border-0 text-[10px] font-black uppercase tracking-widest">
                    ID #{attendee.attendance_number?.toString().padStart(3, '0') || 'PEND'}
                  </Badge>
                  {attendee.istest && (
                    <Badge variant="outline" className="border-blue-400/30 text-blue-300 text-[10px] font-bold bg-blue-500/10">
                      MODO PRUEBA
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Grid de Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Contacto</p>
                <p className="text-white font-medium">{attendee.email}</p>
                <p className="text-xs text-blue-100/60 font-mono">{attendee.phone || 'Sin teléfono'}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Ubicación</p>
                <p className="text-white font-medium">{attendee.church}</p>
                <p className="text-xs text-blue-100/60">Sector {attendee.sector}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Estado Financiero</p>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold text-lg">${attendee.paymentAmount}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-red-400 font-medium">Debe: ${900 - (attendee.paymentAmount || 0)}</span>
                </div>
                <div className="mt-1">{getPaymentBadge(attendee.paymentStatus)}</div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[#f4540a] font-bold">Dotación (Camiseta)</p>
                <div className="flex items-center gap-2 pt-1">
                  {attendee.tshirtsize && attendee.tshirtsize !== 'NA' ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-[#f4540a] text-white font-black px-3 py-1 rounded-lg text-lg shadow-lg shadow-orange-950/20">
                        {attendee.tshirtsize}
                      </div>
                      <p className="text-white font-medium text-sm">Talla confirmada</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 text-white/20 font-black px-3 py-1 rounded-lg text-lg">
                        --
                      </div>
                      <p className="text-blue-100/40 text-xs italic">Sin camiseta asignada</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/40 font-bold">Fecha de Registro</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-mono text-[10px]">
                    {formatDate(attendee.registrationdate)}
                  </Badge>
                </div>
              </div>

              {/* Notas del Asistente (Vista de Detalles) */}
              {attendee.notes && (
                <div className="md:col-span-2 p-4 bg-[#f4540a]/5 rounded-2xl border border-orange-500/20 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#f4540a] font-black">Observaciones / Notas Especiales</p>
                  <p className="text-white text-sm leading-relaxed italic">"{attendee.notes}"</p>
                </div>
              )}
            </div>

            {attendee.paymentReceiptUrl && (
              <div className="pt-2">
                <Button 
                  variant="outline"
                  className="w-full bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20 hover:text-white rounded-xl h-12 font-bold"
                  onClick={() => window.open(attendee.paymentReceiptUrl, '_blank')}
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Ver Comprobante Original
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
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!sectorValue || isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              sectorValue 
                                ? "Seleccione una iglesia" 
                                : "Primero seleccione un sector"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredChurches.map((church) => (
                            <SelectItem 
                              key={`${church.sector}-${church.name}`} 
                              value={church.name}
                            >
                              {church.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Pagado ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="0"
                          className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-[#f4540a]/30"
                        />
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
                        defaultValue="Pendiente"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Revisado">Revisado</SelectItem>
                          <SelectItem value="Pagado">Pagado</SelectItem>
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notas y Observaciones</FormLabel>
                      <FormControl>
                        <textarea 
                          {...field} 
                          className="w-full bg-white/5 border-white/10 text-white rounded-xl h-20 px-4 py-3 focus:ring-[#f4540a]/30 focus:border-[#f4540a] outline-none resize-none"
                          placeholder="Agregue información relevante aquí..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button variant="tangelo" type="submit" disabled={isLoading} className="font-bold">
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
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5 shadow-2xl group">
              <Image 
                src={attendee.paymentReceiptUrl} 
                alt="Comprobante de pago" 
                fill
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex gap-4 w-full">
              <Button 
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white h-12 font-bold rounded-xl"
                onClick={() => window.open(attendee.paymentReceiptUrl, '_blank')}
              >
                Abrir Externo
              </Button>
              <Button 
                className="flex-1 bg-[#f4540a] hover:bg-orange-600 text-white h-12 font-bold rounded-xl shadow-lg shadow-orange-900/20"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 card-glass flex flex-col items-center gap-4">
            <ImageIcon className="h-20 w-20 text-white/5" />
            <p className="text-blue-100/40 italic">No hay comprobante disponible</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="card-glass sm:max-w-[600px]">
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
          <DialogFooter className="border-t border-white/5 pt-4">
            <Button 
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white border-0 h-11 px-8 font-bold rounded-xl"
            >
              Cerrar Ficha
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}