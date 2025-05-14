"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
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
import { Checkbox } from '@/components/ui/checkbox';

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
        const { data, error, count } = await supabase
          .from('attendees')
          .select('id', { count: 'exact' })
          .eq('email', email)
          .limit(1);
        
        if (error) {
          console.error('Error al verificar email:', error.message || error);
          return true; // Permitir el registro si hay error en la verificación
        }
        
        // Si count es 0, significa que el email no existe en la base de datos
        return count === 0;
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
  const [isLoading, setIsLoading] = useState(false);
  const [sectorValue, setSectorValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shirtAvailable, setShirtAvailable] = useState<boolean | null>(null);
  const [checkingShirts, setCheckingShirts] = useState(false);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
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
      tshirtsize: '',
    }
  });

  // Verificar correo electrónico en tiempo real
  const watchedEmail = form.watch("email");
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar disponibilidad de camisetas al cargar el componente
  useEffect(() => {
    checkShirtAvailability();
  }, []);

  // Función para verificar si aún hay camisetas disponibles
  const checkShirtAvailability = async () => {
    try {
      setCheckingShirts(true);
      // Contar registros totales
      const { count, error: countError } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        // console.error('Error al contar registros:', countError);
        setShirtAvailable(null);
        return;
      }
      
      // Determinar si aún hay camisetas disponibles (menos de 100 registros)
      const areTshirtsAvailable = !countError && count !== null && count < 100;
      setShirtAvailable(areTshirtsAvailable);
      // console.log(`Registros totales: ${count}, ¿Camisetas disponibles?: ${areTshirtsAvailable}`);
    } catch (error) {
      // console.error('Error al verificar disponibilidad de camisetas:', error);
      setShirtAvailable(null);
    } finally {
      setCheckingShirts(false);
    }
  };

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
          const { data, error, count } = await supabase
            .from('attendees')
            .select('id', { count: 'exact' })
            .eq('email', watchedEmail)
            .limit(1);
          
          if (error) {
            console.error('Error al verificar email:', error);
            setEmailExists(false);
          } else {
            // Verificar si el correo existe basado en el count
            const exists = count !== null && count > 0;
            setEmailExists(exists);
            
            if (exists) {
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
          setEmailExists(false);
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
  
  // Función para comprimir imagen
  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 0.5, // máximo 500KB (más agresivo)
        maxWidthOrHeight: 1280, // máximo 1280px de ancho o alto (más pequeño)
        useWebWorker: true,
        onProgress: (progress: number) => {
          setUploadProgress(Math.round(progress * 50)); // Primera mitad del progreso (compresión)
        },
      };
      
      console.log('Iniciando compresión. Tamaño original:', file.size / 1024, 'KB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compresión completada. Tamaño final:', compressedFile.size / 1024, 'KB');
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
      return file; // devolver archivo original en caso de error
    }
  };

  // Función para subir imagen a Supabase Storage
  const uploadPaymentReceipt = async (file: File): Promise<string | null> => {
    try {
      // Primero comprimir la imagen
      const compressedFile = await compressImage(file);
      
      // Generar nombre único para el archivo
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      console.log('Subiendo archivo a payment-receipts bucket...');
      
      // Establecer progreso al 50% (después de la compresión)
      setUploadProgress(50);
      
      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('payment-receipts/payment-receipts')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('Error al subir comprobante:', error);
        throw error;
      }
      
      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts/payment-receipts')
        .getPublicUrl(fileName);
      
      console.log('Comprobante subido correctamente:', publicUrlData.publicUrl);
      
      // Establecer progreso al 100% (carga completa)
      setUploadProgress(100);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error en uploadPaymentReceipt:', error);
      return null;
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentReceiptFile(file);
      
      // Actualizar el valor en el formulario
      form.setValue('paymentReceipt', file, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    // Capturar evento de Google Analytics
    // @ts-ignore
    if (window.gtag) {
      // @ts-ignore
      window.gtag('event', 'start_registration', {
        event_category: 'registration',
        event_label: 'Intento de registro'
      });
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);
    
    try {
      // Verificar si hay comprobante de pago
      if (!paymentReceiptFile) {
        setError("El comprobante de pago es obligatorio");
        setIsSubmitting(false);
        setIsLoading(false);
        return;
      }
      
      // Subir comprobante de pago a Storage y obtener la URL
      const receiptUrl = await uploadPaymentReceipt(paymentReceiptFile);
      
      if (!receiptUrl) {
        setError("Error al subir el comprobante de pago. Por favor intenta de nuevo.");
        setIsSubmitting(false);
        setIsLoading(false);
        return;
      }

      // Verificar si hay espacio para una camiseta
      const { count, error: countError } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        // console.error('Error al contar registros:', countError);
      }
      
      // Determinar si este registro recibe camiseta (menos de 100 registros)
      const canReceiveTshirt = (!countError && count !== null && count < 100);
      // console.log(`Registros actuales: ${count}, ¿Puede recibir camiseta?: ${canReceiveTshirt}`);
      
      // Actualizar la disponibilidad de camisetas para la UI
      setShirtAvailable(count !== null && count < 100);

      // Crear el objeto de datos a insertar con logs
      const registrationData = {
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.email,
        phone: data.phone,
        church: data.church,
        sector: data.sector,
        registrationdate: new Date().toISOString(),
        tshirtsize: data.tshirtsize || null, // Guardar la talla seleccionada o null
        receives_tshirt: canReceiveTshirt, // Indicar si REALMENTE se asigna una del stock
        paymentreceipturl: receiptUrl, // URL del comprobante de pago
        paymentamount: 0, // Monto de pago predeterminado
      };
      
      // Intentar crear el registro en la base de datos
      try {
        // console.log("Iniciando inserción en base de datos");
        const { data: attendeeData, error } = await supabase
          .from('attendees')
          .insert([registrationData])
          .select()
          .single();

        if (error) {
          // console.error('Error al crear registro:', error);
          throw new Error(`Error al crear el registro: ${error.message}`);
        }

        // console.log("Registro creado exitosamente. Datos completos retornados:", attendeeData);
        // console.log("VERIFICACIÓN DE TALLA:");
        // console.log("- Talla que se intentó guardar:", data.tshirtsize);
        // console.log("- Talla recibida de la base de datos:", attendeeData.tshirtsize);
        // console.log("- ¿Son iguales?", data.tshirtsize === attendeeData.tshirtsize);
        // console.log("- Valor exacto en DB:", JSON.stringify(attendeeData.tshirtsize));
        // console.log("- Tipo de talla en DB:", typeof attendeeData.tshirtsize);
        
        // Generar datos para el QR
        const qrData = {
          id: attendeeData.id,
          nombre: `${data.firstName} ${data.lastName}`,
          email: data.email,
          iglesia: data.church,
          sector: data.sector,
          monto: registrationData.paymentamount,
          estado: 'Pendiente',
          fecha: registrationData.registrationdate,
          paymentreceipturl: registrationData.paymentreceipturl, // Incluir URL del comprobante en el QR
          tshirtsize: attendeeData.tshirtsize
        };

        // Convertir a JSON string para el QR
        const qrValue = JSON.stringify(qrData);
        // console.log('QR Data generado:', qrValue);
        
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
                qrData: qrValue,
                receivesTshirt: attendeeData.receives_tshirt,
                tshirtSize: attendeeData.tshirtsize
              })
            });
            // console.log("Solicitud de correo enviada con datos de camiseta:", {
            //   receivesTshirt: attendeeData.receives_tshirt,
            //   tshirtSize: attendeeData.tshirtsize
            // });
          }
        } catch (emailError) {
          // console.error('Error al contactar el servicio de correo:', emailError);
        }

        // Completar proceso exitosamente
        setIsSuccess(true);
        setQrData(qrValue);
        onSuccess(attendeeData, qrValue);
        form.reset();
        toast.success("¡Registro completado con éxito!");

        if ((window as any).gtag) {
          (window as any).gtag('event', 'sign_up', {
            method: 'form',
            event_category: 'engagement',
            event_label: 'Registration Success',
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            church: data.church,
            sector: data.sector,
            qrData: qrValue
          });
        }
      } catch (dbError: any) {
        // console.error('Error en la base de datos:', dbError);
        setError(dbError.message || 'Ha ocurrido un error al procesar tu registro.');
        toast.error("Error al guardar el registro");
      }
    } catch (error: any) {
      // console.error('Error general al enviar el formulario:', error);
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

  // Detectar si es un dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = 
        typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobileDevice(mobile);
    };
    
    checkIfMobile();
  }, []);

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
                  <FormLabel>Nombre(s)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ingrese su nombre(s)" 
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
                  <FormLabel>Apellido(s)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ingrese su apellido(s)" 
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
            {/* Mostrar campo de talla solo si aún hay disponibilidad */}
            {(shirtAvailable === null || shirtAvailable) && (
              <FormField
                control={form.control}
                name="tshirtsize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Talla de Camiseta *
                      {checkingShirts && (
                        <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const formValues = form.getValues();
                      }}
                      value={field.value}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione su talla" />
                        </SelectTrigger>
                      </FormControl>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {shirtAvailable === null
                        ? "Cargando disponibilidad..."
                        : "* Disponible para los primeros 100 asistentes *"
                      }
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Talla actual: {field.value || "No seleccionada"}
                    </p>
                  </FormItem>
                )}
              />
            )}
            
            {/* Mensaje cuando ya no hay camisetas disponibles */}
            {shirtAvailable === false && (
              <div className="rounded-md border p-4 bg-amber-50">
                <p className="text-sm font-medium text-amber-800">
                  Lo sentimos, ya no hay camisetas disponibles
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Las camisetas eran limitadas para los primeros 100 asistentes y ya se han agotado.
                </p>
              </div>
            )}
            
            {/* Campo de comprobante de pago */}
            <FormItem>
              <FormLabel>Comprobante de Pago *</FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-2">
                  {isMobileDevice ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-center text-sm p-2 h-auto space-y-1 flex-col py-3"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files[0]) {
                              handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
                            }
                          };
                          input.click();
                        }}
                        disabled={isLoading || isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Tomar Foto</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-center text-sm p-2 h-auto space-y-1 flex-col py-3"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files[0]) {
                              handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
                            }
                          };
                          input.click();
                        }}
                        disabled={isLoading || isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Galería</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <label className="block">
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-primary cursor-pointer transition-colors">
                          <div className="flex flex-col items-center space-y-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-600">Haz clic para seleccionar una imagen</span>
                            <span className="text-xs text-gray-500">PNG, JPG, GIF (máx. 10MB)</span>
                          </div>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isLoading || isSubmitting}
                            required
                            className="hidden"
                          />
                        </div>
                      </label>
                    </div>
                  )}
                  {paymentReceiptFile && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        Archivo seleccionado: {paymentReceiptFile.name} ({Math.round(paymentReceiptFile.size / 1024)} KB)
                      </p>
                      <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={URL.createObjectURL(paymentReceiptFile)} 
                          alt="Vista previa del comprobante" 
                          className="w-full h-full object-contain"
                          onLoad={() => URL.revokeObjectURL(URL.createObjectURL(paymentReceiptFile))}
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          onClick={() => {
                            setPaymentReceiptFile(null);
                            setUploadProgress(0);
                            // @ts-ignore - Ignorar el error del tipado al establecer null
                            form.setValue('paymentReceipt', null);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {uploadProgress > 0 && (
                    <div className="w-full">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadProgress < 100 ? `Procesando: ${uploadProgress}%` : 'Carga completa'}
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">
                Sube una imagen de tu comprobante de pago
              </p>
            </FormItem>
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