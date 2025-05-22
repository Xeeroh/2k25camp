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
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Verificar si hay un error en la URL
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
        if (!hash) {
          console.log('No hay token de restablecimiento, redirigiendo a login');
          router.push('/admin');
          return;
        }

        // Verificar si el token es válido intentando obtener la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al verificar token:', sessionError);
          router.push('/admin');
          return;
        }

        // Si no hay sesión pero hay hash, es normal porque el usuario aún no ha actualizado la contraseña
        if (!session && hash) {
          console.log('Token de restablecimiento válido');
          return;
        }

        // Si hay sesión y hash, el usuario ya actualizó la contraseña
        if (session && hash) {
          console.log('Usuario ya actualizó la contraseña, redirigiendo a admin');
          router.push('/admin');
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        router.push('/admin');
      }
    };
    
    checkResetToken();
  }, [router]);
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // Obtener el token del hash de la URL
      const hash = window.location.hash;
      console.log('Hash de la URL:', hash);
      
      if (!hash) {
        throw new Error('No se encontró el token de restablecimiento');
      }

      // Extraer el token del hash
      const params = new URLSearchParams(hash.substring(1));
      console.log('Parámetros del hash:', Object.fromEntries(params.entries()));
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      console.log('Access Token:', accessToken ? 'Presente' : 'No presente');
      console.log('Refresh Token:', refreshToken ? 'Presente' : 'No presente');
      
      if (!accessToken || !refreshToken) {
        // Intentar obtener el token de los parámetros de búsqueda como respaldo
        const searchParams = new URLSearchParams(window.location.search);
        const type = searchParams.get('type');
        const token = searchParams.get('token');
        
        console.log('Parámetros de búsqueda:', {
          type,
          token: token ? 'Presente' : 'No presente'
        });
        
        if (type === 'recovery' && token) {
          // Si tenemos un token de recuperación, intentar usarlo directamente
          const { error: updateError } = await supabase.auth.updateUser({
            password: data.password
          });
          
          if (updateError) throw updateError;
          
          setSuccess(true);
          toast.success('Contraseña actualizada exitosamente');
          
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
          return;
        }
        
        throw new Error('Token de acceso no encontrado');
      }

      // Establecer la sesión
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) throw sessionError;

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      toast.success('Contraseña actualizada exitosamente');
      
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error("Error al actualizar la contraseña:", error);
      let errorMessage = "Hubo un error al actualizar la contraseña. Por favor intente de nuevo.";
      
      if (error.message?.includes('No se encontró') || error.message?.includes('Token de acceso')) {
        errorMessage = "El enlace de restablecimiento ha expirado o es inválido. Por favor, solicite un nuevo enlace.";
        router.push('/admin/reset-password');
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
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