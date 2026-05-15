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
import { Loader2, ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react';
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
      setCooldownTime(60); // Evitar spam
      toast.success('Se ha enviado el enlace de recuperación');
    } catch (err: any) {
      console.error("Error reset:", err);
      let errorMessage = "Error al enviar el correo. Intenta más tarde.";
      
      if (err.message?.includes('rate limit') || err.status === 429) {
        setCooldownTime(60);
        errorMessage = "Límite de correos excedido. Debes esperar 1 minuto.";
      } else if (err.message?.includes('security purposes')) {
        const waitTime = parseInt(err.message.match(/\d+/)?.[0] || '60');
        setCooldownTime(waitTime);
        errorMessage = `Por seguridad, espera ${waitTime} segundos.`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-try min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-xs font-black text-white/40 hover:text-[#f4540a] mb-6 transition-colors uppercase tracking-widest group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver al Login
        </Link>
        
        <div className="card-glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="h-20 w-20 bg-gradient-to-br from-[#f4540a] to-[#d44808] rounded-3xl flex items-center justify-center shadow-xl">
               <Mail className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center mt-8 mb-10 space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              Recuperar <span className="text-[#f4540a]">Acceso</span>
            </h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Ingresa tu correo para recibir un enlace de restauración.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black mb-8 animate-pulse text-center uppercase tracking-wider">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="py-6 text-center animate-in zoom-in-95 duration-500">
               <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="h-8 w-8 text-green-500" />
               </div>
               <p className="text-xl font-black text-white uppercase italic">¡ENLACE ENVIADO!</p>
               <p className="text-white/40 text-xs mt-2 font-bold uppercase tracking-widest">
                 Revisa tu bandeja de entrada y sigue las instrucciones.
               </p>
               <div className="mt-8 pt-6 border-t border-white/5">
                 <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                   Podrás solicitar otro en {cooldownTime}s
                 </p>
               </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black text-[#f4540a] uppercase tracking-widest ml-1">Correo Electrónico</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type="email" 
                            placeholder="tu-email@ejemplo.com" 
                            className="bg-white/5 border-white/10 rounded-2xl h-14 pl-5 text-white font-black group-focus-within:border-[#f4540a]/50 transition-all uppercase text-xs"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoading || cooldownTime > 0}
                  className="w-full h-16 rounded-[1.5rem] bg-[#f4540a] hover:bg-[#d44808] text-white font-black text-lg transition-transform active:scale-95 shadow-xl shadow-[#f4540a]/20 disabled:opacity-50 disabled:grayscale"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : cooldownTime > 0 ? (
                    <span className="text-sm">ESPERAR {cooldownTime}S</span>
                  ) : (
                    <div className="flex items-center">
                      <Send size={18} className="mr-2" />
                      ENVIAR ENLACE
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
} 