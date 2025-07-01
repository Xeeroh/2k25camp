"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();
  const { hasRole } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Función para determinar la ruta de redirección según el rol
  const getRedirectPath = () => {
    if (hasRole('admin')) {
      return '/admin';
    } else if (hasRole('editor')) {
      return '/comite';
    } else {
      return '/';
    }
  };
  
  useEffect(() => {
    const validateResetToken = async () => {
      try {
        setIsValidating(true);
        
        // Verificar si hay errores en la URL
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (error === 'access_denied' && errorCode === 'otp_expired') {
          console.log('Enlace expirado, redirigiendo a reset-password');
          toast.error('El enlace de restablecimiento ha expirado. Por favor, solicite uno nuevo.');
          router.push('/admin/reset-password');
          return;
        }

        // Verificar si hay un token de restablecimiento en la URL
        const hash = window.location.hash;
        const searchType = searchParams.get('type');
        const searchToken = searchParams.get('token');
        
        console.log('Validando token de restablecimiento:', {
          hash: hash ? 'Presente' : 'No presente',
          searchType,
          searchToken: searchToken ? 'Presente' : 'No presente'
        });

        // Si no hay hash ni parámetros de búsqueda válidos, redirigir
        if (!hash && (!searchType || !searchToken)) {
          console.log('No hay token de restablecimiento válido, redirigiendo a login');
          toast.error('Enlace de restablecimiento inválido');
          router.push('/admin');
          return;
        }

        // Verificar si ya hay una sesión activa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al verificar sesión:', sessionError);
          toast.error('Error al verificar la sesión');
          router.push('/admin');
          return;
        }

        // Si hay una sesión activa, el usuario ya está autenticado
        if (session) {
          console.log('Usuario ya autenticado, redirigiendo según rol');
          const redirectPath = getRedirectPath();
          router.push(redirectPath);
          return;
        }

        // Si llegamos aquí, el token es válido y podemos proceder
        console.log('Token de restablecimiento válido, mostrando formulario');
        setIsValidating(false);
        
      } catch (error) {
        console.error('Error al validar token:', error);
        toast.error('Error al validar el enlace de restablecimiento');
        router.push('/admin');
      }
    };
    
    validateResetToken();
  }, [router, hasRole]);
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // Obtener el token del hash de la URL
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const searchType = searchParams.get('type');
      const searchToken = searchParams.get('token');
      
      console.log('Procesando actualización de contraseña:', {
        hash: hash ? 'Presente' : 'No presente',
        searchType,
        searchToken: searchToken ? 'Presente' : 'No presente'
      });
      
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Intentar extraer tokens del hash primero
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
        
        console.log('Tokens del hash:', {
          accessToken: accessToken ? 'Presente' : 'No presente',
          refreshToken: refreshToken ? 'Presente' : 'No presente'
        });
      }

      // Si no hay tokens en el hash, intentar con los parámetros de búsqueda
      if (!accessToken && searchType === 'recovery' && searchToken) {
        console.log('Usando token de recuperación de parámetros de búsqueda');
        
        // Intentar actualizar la contraseña directamente con el token de recuperación
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password
        });
        
        if (updateError) {
          console.error('Error al actualizar contraseña con token de recuperación:', updateError);
          throw updateError;
        }
        
        setSuccess(true);
        toast.success('Contraseña actualizada exitosamente');
        
        // Esperar un momento para que se actualice el estado de autenticación
        setTimeout(() => {
          const redirectPath = getRedirectPath();
          router.push(redirectPath);
        }, 2000);
        return;
      }

      // Si tenemos tokens del hash, establecer la sesión primero
      if (accessToken && refreshToken) {
        console.log('Estableciendo sesión con tokens del hash');
        
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Error al establecer sesión:', sessionError);
          throw sessionError;
        }

        // Ahora actualizar la contraseña
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password
        });
        
        if (updateError) {
          console.error('Error al actualizar contraseña:', updateError);
          throw updateError;
        }
        
        setSuccess(true);
        toast.success('Contraseña actualizada exitosamente');
        
        // Esperar un momento para que se actualice el estado de autenticación
        setTimeout(() => {
          const redirectPath = getRedirectPath();
          router.push(redirectPath);
        }, 2000);
        return;
      }

      // Si no tenemos tokens válidos
      throw new Error('No se encontraron tokens de restablecimiento válidos');
      
    } catch (error: any) {
      console.error("Error al actualizar la contraseña:", error);
      let errorMessage = "Hubo un error al actualizar la contraseña. Por favor intente de nuevo.";
      
      if (error.message?.includes('No se encontraron tokens') || 
          error.message?.includes('Token de acceso') ||
          error.message?.includes('Invalid token') ||
          error.message?.includes('expired')) {
        errorMessage = "El enlace de restablecimiento ha expirado o es inválido. Por favor, solicite un nuevo enlace.";
        toast.error(errorMessage);
        setTimeout(() => {
          router.push('/admin/reset-password');
        }, 2000);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mostrar loading mientras se valida el token
  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground">Validando enlace de restablecimiento...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Actualizar Contraseña
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
            </p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>
                  Contraseña actualizada exitosamente. Redirigiendo...
                </span>
              </div>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 