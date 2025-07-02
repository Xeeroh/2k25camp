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
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link 
              href="/admin" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio de sesión
            </Link>
            
            <h2 className="text-3xl font-bold tracking-tight">
              Restablecer Contraseña
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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
                  Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.
                </span>
              </div>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="ejemplo@correo.com" 
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
                disabled={isLoading || cooldownTime > 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : cooldownTime > 0 ? (
                  `Esperar ${cooldownTime} segundos`
                ) : (
                  "Enviar enlace de restablecimiento"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 