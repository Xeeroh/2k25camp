"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, Download } from 'lucide-react';
import { CHURCHES_DATA } from '@/lib/churches-data';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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
  paymentAmount: z.coerce.number()
    .min(400, "El monto mínimo para apartar el campamento es de $400")
    .max(10000, "El monto no puede ser mayor a $10,000"),
  paymentFile: z.any(),
});

type FormValues = z.infer<typeof formSchema>;

interface RegistrationFormProps {
  onSuccess: (data: any, qrCode: string) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sectorValue, setSectorValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      sector: '',
      church: '',
      paymentAmount: 400,
      paymentFile: undefined
    }
  });

  // Verificar correo electrónico en tiempo real
  const watchedEmail = form.watch("email");
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Solo verificar si el email tiene un formato válido
    if (watchedEmail && watchedEmail.includes('@') && watchedEmail.includes('.')) {
      setIsCheckingEmail(true);
      
      // Limpiar timeout previo
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      // Debounce para no hacer muchas peticiones
      emailCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('attendees')
            .select('id')
            .eq('email', watchedEmail)
            .maybeSingle();
          
          if (error) {
            console.error('Error al verificar email:', error);
            setEmailExists(false);
          } else {
            setEmailExists(!!data);
            
            if (data) {
              form.setError("email", { 
                type: "manual", 
                message: "Este correo electrónico ya está registrado" 
              });
            } else {
              form.clearErrors("email");
            }
          }
        } catch (error) {
          console.error('Error en la validación del email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }, 500);
    }
    
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [watchedEmail, form]);

  // Función para formatear el número de teléfono
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };
  
  const onSubmit = async (data: FormValues) => {
    console.log("Iniciando onSubmit con datos:", data);
    
    try {
      // Prevenir envíos duplicados
      if (isSubmitting) {
        console.log("Formulario ya está siendo enviado, abortando envío duplicado");
        return;
      }
      
      // Activar primero los estados para bloquear interfaz
      setIsSubmitting(true);
      setIsLoading(true);
      setIsSuccess(false);
      setError(null);
      
      console.log("Estado de formulario actualizado, procediendo con el registro");

      // Subir el comprobante de pago si existe
      let paymentReceiptUrl = '';
      try {
        if (data.paymentFile && data.paymentFile instanceof FileList && data.paymentFile.length > 0) {
          console.log("Iniciando subida de archivo");
          
          const file = data.paymentFile[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `payment-${Date.now()}.${fileExt}`;
          const filePath = `payment-receipts/${fileName}`;

          console.log("Subiendo archivo:", fileName);
          const { error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error al subir archivo:', uploadError);
            toast.error(`Error al subir el comprobante: ${uploadError.message}`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('payment-receipts')
              .getPublicUrl(filePath);

            paymentReceiptUrl = publicUrl;
            console.log("Archivo subido correctamente, URL:", paymentReceiptUrl);
          }
        } else {
          console.log("No hay archivo adjunto para subir");
        }
      } catch (uploadError) {
        console.error('Error en la subida:', uploadError);
        toast.error('Error al subir el archivo del comprobante');
      }

      // Intentar crear el registro en la base de datos
      try {
        console.log("Iniciando inserción en base de datos");
        const { data: attendeeData, error } = await supabase
          .from('attendees')
          .insert([
            {
              firstname: data.firstName,
              lastname: data.lastName,
              email: data.email,
              phone: data.phone,
              church: data.church,
              sector: data.sector,
              paymentamount: data.paymentAmount,
              paymentstatus: data.paymentAmount >= 900 ? 'Completado' : 'Pendiente',
              registrationdate: new Date().toISOString(),
              paymentreceipturl: paymentReceiptUrl
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error al crear registro:', error);
          throw new Error(`Error al crear el registro: ${error.message}`);
        }

        console.log("Registro creado exitosamente:", attendeeData);

        // Generar datos para el QR
        const qrData = {
          id: attendeeData.id,
          nombre: `${data.firstName} ${data.lastName}`,
          email: data.email,
          iglesia: data.church,
          sector: data.sector,
          monto: data.paymentAmount,
          estado: data.paymentAmount >= 900 ? 'Completado' : 'Pendiente',
          fecha: new Date().toISOString()
        };

        // Convertir a JSON string para el QR
        const qrValue = JSON.stringify(qrData);
        console.log('QR Data generado:', qrValue);
        
        // Enviar correo (opcional, no bloqueamos si falla)
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseAnonKey) {
            await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                church: data.church,
                sector: data.sector,
                paymentAmount: data.paymentAmount,
                qrData: qrValue
              })
            });
            console.log("Solicitud de correo enviada");
          }
        } catch (emailError) {
          console.error('Error al contactar el servicio de correo:', emailError);
        }

        // Completar proceso exitosamente
        setIsSuccess(true);
        setQrData(qrValue);
        onSuccess(attendeeData, qrValue);
        form.reset();
        toast.success("¡Registro completado con éxito!");
      } catch (dbError: any) {
        console.error('Error en la base de datos:', dbError);
        setError(dbError.message || 'Ha ocurrido un error al procesar tu registro.');
        toast.error("Error al guardar el registro");
      }
    } catch (error: any) {
      console.error('Error general al enviar el formulario:', error);
      setError(error.message || 'Ha ocurrido un error al procesar tu registro.');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };
  
  // Filter churches based on selected sector
  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sectorValue || 
              (sectorValue === "Foráneo" && church.sector === "Foráneo")
  );

  const handleDownloadQR = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            // Parsear el objeto QR para extraer el nombre del asistente
            try {
              const qrDataObj = JSON.parse(qrData || '{}');
              const fileName = qrDataObj.nombre || 'asistente';
              link.download = `qr-${fileName.replace(/\s+/g, '-')}.png`;
            } catch (e) {
              link.download = `qr-asistente.png`;
            }
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
        <p className="text-muted-foreground mb-4">
          Tu registro ha sido completado exitosamente. Te enviaremos un correo con los detalles.
        </p>
        
        {qrData && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Tu código QR para el check-in</h3>
            <div className="flex justify-center mb-4" ref={qrRef}>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={qrData}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="mb-4">
              {(() => {
                try {
                  const qrDataObj = JSON.parse(qrData);
                  return (
                    <div className="flex flex-col gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Estado de pago:</span>
                        <span className={`px-2 py-0.5 rounded-full text-sm ${
                          qrDataObj.estado === 'Completado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {qrDataObj.estado}
                        </span>
                      </div>
                      {qrDataObj.estado === 'Pendiente' && (
                        <p className="text-sm text-muted-foreground">
                          El pago total del campamento es de $900. 
                          {qrDataObj.monto < 900 && ` Has pagado $${qrDataObj.monto}, restan $${900 - qrDataObj.monto}.`}
                        </p>
                      )}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="mb-4"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar Código QR
            </Button>
          </div>
        )}
        
        <Button 
          onClick={() => {
            setIsSuccess(false);
            form.reset();
            setQrData(null);
          }}
        >
          Registrar otro asistente
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ingrese su nombre" 
                      {...field} 
                      disabled={isLoading || isSubmitting}
                    />
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
                    <Input 
                      placeholder="Ingrese su apellido" 
                      {...field} 
                      disabled={isLoading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="correo@ejemplo.com" 
                        {...field} 
                        disabled={isLoading || isSubmitting}
                        className={emailExists ? "pr-10 border-red-300" : ""}
                      />
                    </FormControl>
                    {isCheckingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="(123) 456-7890" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      disabled={isLoading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={isLoading || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un sector" />
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
                    disabled={!sectorValue || isLoading || isSubmitting}
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Pagado</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="400.00" 
                      {...field} 
                      disabled={isLoading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">Mínimo $400 para apartar. Pago completo: $900</p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Comprobante de Pago</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        console.log("Archivo seleccionado:", e.target.files);
                        onChange(e.target.files);
                      }}
                      disabled={isLoading || isSubmitting}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">Formatos aceptados: JPG, PNG, PDF. Máximo 5MB.</p>
                </FormItem>
              )}
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