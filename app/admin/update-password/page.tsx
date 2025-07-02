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
  const { hasRole, user } = useAuth();
  
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
        const fromReset = searchParams.get('from_reset');

        if (error === 'access_denied' && errorCode === 'otp_expired') {
          toast.error('El enlace de restablecimiento ha expirado. Por favor, solicite uno nuevo.');
          router.push('/admin/reset-password');
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

        // Verificar si venimos de un enlace de restablecimiento
        const hash = window.location.hash;
        const searchType = searchParams.get('type');
        const searchToken = searchParams.get('token');
        
        const isFromResetLink = hash || (searchType && searchToken) || fromReset === 'true';

        // Si hay una sesión activa pero NO venimos de un enlace de restablecimiento
        if (session && !isFromResetLink) {
          const redirectPath = getRedirectPath();
          router.push(redirectPath);
          return;
        }

        // Si hay una sesión activa Y venimos de un enlace de restablecimiento
        if (session && isFromResetLink) {
          setIsValidating(false);
          return;
        }

        // Si no hay sesión, mostrar el formulario (modo desarrollo)
        setIsValidating(false);
        
      } catch (error) {
        console.error('Error al validar token:', error);
        toast.error('Error al validar el enlace de restablecimiento');
        router.push('/admin');
      }
    };
    
    // Solo ejecutar una vez al montar el componente
    validateResetToken();
  }, []); // Sin dependencias para evitar loops
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // Intentar actualizar la contraseña directamente
      // Supabase manejará automáticamente la sesión
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
      
    } catch (error: any) {
      console.error("Error al actualizar la contraseña:", error);
      let errorMessage = "Hubo un error al actualizar la contraseña. Por favor intente de nuevo.";
      
      // Manejar errores específicos de Supabase
      if (error.message?.includes('Invalid recovery token')) {
        errorMessage = "Token de recuperación inválido. Necesitas un enlace válido de restablecimiento.";
        toast.error(errorMessage);
        setTimeout(() => {
          router.push('/admin/reset-password');
        }, 2000);
      } else if (error.message?.includes('User not found')) {
        errorMessage = "Usuario no encontrado. Debes estar autenticado o tener un token válido.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (error.message?.includes('expired')) {
        errorMessage = "El enlace de restablecimiento ha expirado. Por favor, solicite un nuevo enlace.";
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
              {user ? 
                "Tu sesión ha sido restaurada. Ahora puedes establecer tu nueva contraseña." :
                "Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar."
              }
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