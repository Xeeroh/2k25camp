"use client";

import { useState, useRef } from 'react';
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
    .email("Correo electrónico no válido")
    .refine(async (email) => {
      try {
        const { data, error } = await supabase
          .from('attendees')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (error) {
          console.error('Error al verificar email:', error);
          return true; // Permitir el registro si hay error en la verificación
        }
        
        return !data; // Retorna true si el email no existe
      } catch (error) {
        console.error('Error en la validación del email:', error);
        return true; // Permitir el registro si hay error
      }
    }, "Este correo electrónico ya está registrado"),
  phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede tener más de 15 dígitos")
    .regex(/^[0-9()-\s]+$/, "El teléfono solo puede contener números, paréntesis, guiones y espacios"),
  sector: z.string({ required_error: "Por favor seleccione un sector" }),
  church: z.string({ required_error: "Por favor seleccione una iglesia" }),
  paymentAmount: z.coerce.number()
    .min(1, "El monto debe ser mayor a 0")
    .max(10000, "El monto no puede ser mayor a $10,000"),
  paymentFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "El comprobante de pago es requerido")
    .refine(
      (files) => {
        const file = files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        return validTypes.includes(file.type);
      },
      "El archivo debe ser JPG, PNG o PDF"
    )
    .refine(
      (files) => files[0].size <= 5 * 1024 * 1024,
      "El archivo debe ser menor a 5MB"
    ),
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
      paymentAmount: 0,
      paymentFile: undefined
    }
  });

  // Función para formatear el número de teléfono
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setIsSuccess(false);
      setError(null);

      // Subir el comprobante de pago si existe
      let paymentReceiptUrl = '';
      if (data.paymentFile && data.paymentFile[0]) {
        const file = data.paymentFile[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `payment-receipts/${fileName}`;

        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error al subir archivo:', uploadError);
            throw new Error(`Error al subir el archivo: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(filePath);

          paymentReceiptUrl = publicUrl;
        } catch (uploadError) {
          console.error('Error en la subida:', uploadError);
          throw new Error('Error al subir el archivo');
        }
      }

      // Versión simplificada: Usar directamente Supabase para crear el registro
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
            paymentstatus: 'Pendiente',
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

      // Generar datos para el QR
      const qrData = {
        id: attendeeData.id,
        nombre: `${data.firstName} ${data.lastName}`,
        email: data.email,
        iglesia: data.church,
        sector: data.sector,
        monto: data.paymentAmount,
        estado: 'Pendiente',
        fecha: new Date().toISOString()
      };

      // Convertir a JSON string para el QR
      const qrValue = JSON.stringify(qrData);
      console.log('QR Data generado:', qrValue);
      
      // Enviar correo de confirmación usando la Edge Function
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('Faltan variables de entorno para Supabase');
          throw new Error('Error en la configuración');
        }

        console.log('Enviando correo con los siguientes datos:', {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          church: data.church,
          sector: data.sector,
          paymentAmount: data.paymentAmount,
          qrData: qrValue
        });

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
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

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('Error al enviar el correo:', errorData);
          // Mostrar toast con error pero continuar con el registro
          toast.error(`No se pudo enviar el correo de confirmación: ${errorData.error || 'Error desconocido'}`);
        } else {
          const emailResult = await emailResponse.json();
          console.log('Respuesta del servicio de correo:', emailResult);
          if (emailResult.success) {
            toast.success(`Correo de confirmación enviado a ${data.email}. Revisa tu bandeja de entrada o carpeta de spam.`);
          } else {
            console.error('El servicio de correo reportó un error:', emailResult.error);
            toast.error(`Error al enviar el correo: ${emailResult.error || 'Error desconocido'}`);
          }
        }
      } catch (emailError) {
        console.error('Error al contactar el servicio de correo:', emailError);
        // Mostrar toast con error pero continuar con el registro
        toast.error(`No se pudo contactar al servicio de correo: ${emailError instanceof Error ? emailError.message : 'Error desconocido'}`);
      }

      setIsSuccess(true);
      setQrData(qrValue); // Guardar los datos del QR para mostrarlos
      
      // Llamar a onSuccess y pasar directamente el qrValue
      onSuccess(attendeeData, qrValue);
      form.reset();
    } catch (error: any) {
      console.error('Error al enviar el formulario:', error);
      setError(error.message || 'Ha ocurrido un error al procesar tu registro.');
    } finally {
      setIsLoading(false);
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
            link.download = `qr-${qrData?.split('"nombreCompleto":"')[1].split('"')[0].replace(/\s+/g, '-')}.png`;
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="correo@ejemplo.com" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
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
                      disabled={isLoading}
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
                    disabled={isLoading}
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
                      placeholder="0.00" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
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
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
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
        </form>
      </Form>
    </div>
  );
}