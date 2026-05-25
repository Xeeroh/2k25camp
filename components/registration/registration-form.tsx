"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PersonalInfoFields, ChurchFields, ShirtField } from './form-fields';
import { PaymentReceiptField } from './payment-receipt-field';
import { SuccessMessage } from './success-message';
import { useRegistration } from '@/hooks/useRegistration';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { useShirtAvailability } from '@/hooks/useShirtAvailability';
import { toast } from 'sonner';

// Form schema with validation
const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tshirtsize: z.string().optional(),
  email: z.string().email("Correo electrónico no válido"),
  phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede tener más de 15 dígitos")
    .regex(/^[0-9()-\s]+$/, "El teléfono solo puede contener números, paréntesis, guiones y espacios"),
  sector: z.string().min(1, "Por favor seleccione un sector"),
  church: z.string().min(1, "Por favor seleccione una iglesia"),
  // paymentReceipt se maneja fuera de Zod con useState (los File objects no pueden ser defaultValues)
  attendees: z.array(z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    tshirtsize: z.string().optional(),
  })).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface RegistrationFormProps {
  onSuccess: (data: any, qrCode: string) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [isGroup, setIsGroup] = useState(false);
  const [sectorValue, setSectorValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  
  const { isLoading, isSubmitting, error, uploadProgress, submitRegistration } = useRegistration();
  const { shirtAvailable, checkingShirts } = useShirtAvailability();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      sector: '',
      church: '',
      tshirtsize: '',
      attendees: [{ firstName: '', lastName: '', tshirtsize: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attendees",
  });

  const watchedEmail = form.watch("email");
  const watchedSector = form.watch("sector");
  const { emailExists, isCheckingEmail } = useEmailValidation(form, watchedEmail);

  // Actualizar sectorValue cuando cambie el sector seleccionado
  useEffect(() => {
    setSectorValue(watchedSector || "");
    // También resetear la iglesia cuando cambie el sector
    if (watchedSector && watchedSector !== sectorValue) {
      form.setValue("church", "");
    }
  }, [watchedSector, sectorValue, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (!paymentReceiptFile) {
        toast.error('El comprobante de pago es obligatorio');
        return;
      }
      if (!isGroup && (!data.firstName || !data.lastName)) {
        form.setError("firstName", { type: "manual", message: "Campo obligatorio" });
        form.setError("lastName", { type: "manual", message: "Campo obligatorio" });
        return;
      }
      if (isGroup && (!data.attendees || data.attendees.length === 0)) {
        return;
      }

      if (isGroup && data.attendees) {
        let hasError = false;
        data.attendees.forEach((att, index) => {
          if (!att.firstName || att.firstName.trim().length < 2) {
            form.setError(`attendees.${index}.firstName` as any, { type: "manual", message: "Mínimo 2 caracteres" });
            hasError = true;
          }
          if (!att.lastName || att.lastName.trim().length < 2) {
            form.setError(`attendees.${index}.lastName` as any, { type: "manual", message: "Mínimo 2 caracteres" });
            hasError = true;
          }
        });
        if (hasError) return;
      }
      
      const payloadAttendees = isGroup 
        ? data.attendees || [] 
        : [{ firstName: data.firstName || '', lastName: data.lastName || '', tshirtsize: data.tshirtsize }];

      const { attendeeData, qrValue } = await submitRegistration({
        email: data.email,
        phone: data.phone,
        church: data.church,
        sector: data.sector,
        paymentReceipt: paymentReceiptFile,
        attendees: payloadAttendees
      });
      
      setIsSuccess(true);
      setQrData(qrValue);
      onSuccess(attendeeData, qrValue);
      // Removed form.reset() and setPaymentReceiptFile(null) from here to allow keeping them for group registration
    } catch (error) {
      // El error ya está manejado en el hook useRegistration
    }
  };

  if (isSuccess && qrData) {
    return (
      <SuccessMessage 
        qrData={qrData}
        onReset={() => {
          setIsSuccess(false);
          setQrData(null);
          const currentValues = form.getValues();
          form.reset({
            ...currentValues,
            firstName: '',
            lastName: '',
            tshirtsize: ''
          });
          // Not resetting paymentReceiptFile so they can reuse it for group
        }}
      />
    );
  }
  
  return (
    <div className="card-glass p-8 overflow-hidden mb-20 animate-fade-in animation-delay-200">
      <div className="flex justify-center mb-8 bg-white/5 p-1 rounded-xl">
        <button type="button" onClick={() => setIsGroup(false)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${!isGroup ? "bg-[#f4540a] text-white shadow-lg" : "text-white/60 hover:text-white"}`}>Registro Individual</button>
        <button type="button" onClick={() => setIsGroup(true)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${isGroup ? "bg-[#f4540a] text-white shadow-lg" : "text-white/60 hover:text-white"}`}>Registro Grupal</button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <PersonalInfoFields 
            form={form}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            emailExists={emailExists}
            isCheckingEmail={isCheckingEmail}
            sectorValue={sectorValue}
            shirtAvailable={shirtAvailable}
            checkingShirts={checkingShirts}
            isGroup={isGroup}
          />
          
          <ChurchFields 
            form={form}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            emailExists={emailExists}
            isCheckingEmail={isCheckingEmail}
            sectorValue={sectorValue}
            shirtAvailable={shirtAvailable}
            checkingShirts={checkingShirts}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShirtField 
              form={form}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              emailExists={emailExists}
              isCheckingEmail={isCheckingEmail}
              sectorValue={sectorValue}
              shirtAvailable={shirtAvailable}
              checkingShirts={checkingShirts}
              isGroup={isGroup}
            />
            
            <PaymentReceiptField 
              form={form}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              uploadProgress={uploadProgress}
              onFileChange={setPaymentReceiptFile}
              paymentReceiptFile={paymentReceiptFile}
            />
          </div>

          {isGroup && (
            <div className="space-y-4 pt-6 border-t border-white/10 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-black text-white italic uppercase">Integrantes del Grupo</h3>
                {shirtAvailable === false ? (
                  <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Camisetas Agotadas</p>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tight">Camisetas para los primeros 100</p>
                  </div>
                )}
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-5 rounded-2xl border border-white/10 bg-black/20 relative shadow-inner">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 text-red-400/60 hover:text-red-400 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  <h4 className="text-sm font-bold text-[#f4540a] mb-4 uppercase tracking-widest">Asistente {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`attendees.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80 text-xs uppercase font-bold">Nombre(s)</FormLabel>
                          <FormControl><Input placeholder="Juan" {...field} className="bg-white/5 border-white/10 text-white" disabled={isLoading || isSubmitting || undefined} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`attendees.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80 text-xs uppercase font-bold">Apellido(s)</FormLabel>
                          <FormControl><Input placeholder="Pérez" {...field} className="bg-white/5 border-white/10 text-white" disabled={isLoading || isSubmitting || undefined} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {shirtAvailable !== false && (
                      <FormField
                        control={form.control}
                        name={`attendees.${index}.tshirtsize`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80 text-xs uppercase font-bold">Talla (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isSubmitting || undefined}>
                              <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Talla" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="XS">XS</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="XL">XL</SelectItem>
                                <SelectItem value="XXL">XXL</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            <p className="text-[9px] text-orange-500/60 mt-1">* Sujeto a disponibilidad (Top 100)</p>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ firstName: '', lastName: '', tshirtsize: '' })} className="w-full border-dashed border-2 border-white/20 text-white hover:bg-white/10 h-14 rounded-2xl" disabled={isLoading || isSubmitting || undefined}>
                <Plus className="mr-2 h-5 w-5" /> Añadir otro asistente
              </Button>
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="tangelo"
            className="w-full text-lg h-12 font-bold" 
            disabled={isLoading || isSubmitting || undefined}
          >
            {(isLoading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Completar Registro"
            )}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mt-4">
              {error}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}