"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PersonalInfoFields, ChurchFields, ShirtField } from './form-fields';
import { PaymentReceiptField } from './payment-receipt-field';
import { SuccessMessage } from './success-message';
import { useRegistration } from '@/hooks/useRegistration';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { useShirtAvailability } from '@/hooks/useShirtAvailability';

// Form schema with validation
const formSchema = z.object({
  firstName: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede tener más de 50 caracteres"),
  lastName: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede tener más de 50 caracteres"),
  email: z.string()
    .email("Correo electrónico no válido"),
  phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede tener más de 15 dígitos")
    .regex(/^[0-9()-\s]+$/, "El teléfono solo puede contener números, paréntesis, guiones y espacios"),
  sector: z.string({ required_error: "Por favor seleccione un sector" }),
  church: z.string({ required_error: "Por favor seleccione una iglesia" }),
  tshirtsize: z.string().optional(),
  paymentReceipt: z.custom<File>((val) => val instanceof File || val === null, {
    message: "El comprobante de pago es obligatorio"
  })
});

type FormValues = z.infer<typeof formSchema>;

interface RegistrationFormProps {
  onSuccess: (data: any, qrCode: string) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
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
    }
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
      const { attendeeData, qrValue } = await submitRegistration({
        ...data,
        paymentReceipt: paymentReceiptFile
      });
      
      setIsSuccess(true);
      setQrData(qrValue);
      onSuccess(attendeeData, qrValue);
      form.reset();
      setPaymentReceiptFile(null);
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
          form.reset();
        }}
      />
    );
  }
  
  return (
    <div className="card-glass p-6 rounded-lg shadow-sm border border-border">
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
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
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