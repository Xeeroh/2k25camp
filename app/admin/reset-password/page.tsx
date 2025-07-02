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
import { Loader2, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // Efecto para manejar el contador de tiempo de espera
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    if (cooldownTime > 0) return;
    
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/admin/reset-callback`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Se ha enviado un correo con las instrucciones para restablecer tu contraseña');
    } catch (error: any) {
      console.error("Error al enviar el correo de restablecimiento:", error);
      let errorMessage = "Hubo un error al enviar el correo de restablecimiento. Por favor intente de nuevo.";
      
      if (error.message?.includes('security purposes')) {
        // Extraer el tiempo de espera del mensaje de error
        const waitTime = parseInt(error.message.match(/\d+/)?.[0] || '30');
        setCooldownTime(waitTime);
        errorMessage = `Por razones de seguridad, debes esperar ${waitTime} segundos antes de solicitar otro enlace.`;
      } else if (error.message?.includes('rate limit')) {
        setCooldownTime(30);
        errorMessage = "Demasiados intentos. Por favor, espere 30 segundos antes de intentar de nuevo.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-try min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="card-glass shadow-lg border border-border rounded-lg p-8">
            <div className="text-center mb-8">
              <Link 
                href="/admin" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio de sesión
              </Link>
              
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Restablecer Contraseña
              </h2>
              <p className="text-muted-foreground">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg text-sm mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm mb-6">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="font-medium">¡Enlace enviado!</p>
                    <p className="mt-1">
                      Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="ejemplo@correo.com" 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-850 hover:bg-blue-850/90 text-white" 
                  disabled={isLoading || cooldownTime > 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : cooldownTime > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Esperar {cooldownTime} segundos
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar enlace de restablecimiento
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                ¿Recordaste tu contraseña?{' '}
                <Link href="/admin" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 