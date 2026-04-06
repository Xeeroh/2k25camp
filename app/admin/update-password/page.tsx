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
import { Loader2, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { hasRole, user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const getRedirectPath = () => {
    if (!user) return '/admin';
    if (hasRole('admin')) return '/admin';
    if (hasRole('editor') || user.role === 'comite') return '/comite';
    return '/';
  };
  
  useEffect(() => {
    const validateResetToken = async () => {
      try {
        setIsValidating(true);
        
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const fromReset = searchParams.get('from_reset');

        if (errorParam === 'access_denied' && errorCode === 'otp_expired') {
          toast.error('El enlace ha expirado. Por favor solicita uno nuevo.');
          router.push('/admin/reset-password');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const hash = window.location.hash;
        const type = searchParams.get('type');
        const isRecovery = hash.includes('type=recovery') || type === 'recovery' || fromReset === 'true';

        if (session && !isRecovery) {
          router.push(getRedirectPath());
          return;
        }

        setIsValidating(false);
      } catch (err) {
        console.error('Error validation:', err);
        setIsValidating(false);
      }
    };
    
    validateResetToken();
  }, [user]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      toast.success('¡Contraseña actualizada con éxito!');
      
      setTimeout(() => {
        router.push(getRedirectPath());
      }, 2000);
      
    } catch (err: any) {
      console.error("Error al actualizar:", err);
      const msg = err.message?.includes('expired') 
        ? "El enlace ha expirado. Solicita otro."
        : "No se pudo actualizar la contraseña. Intenta de nuevo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isValidating) {
    return (
      <div className="bg-try min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card-glass p-12 rounded-[2rem] text-center space-y-6 max-w-sm w-full">
          <div className="h-16 w-16 bg-[#f4540a]/20 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-[#f4540a] animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Verificando Seguridad...</h2>
          <Loader2 className="h-8 w-8 animate-spin text-[#f4540a] mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-try min-h-screen flex flex-col py-12 px-4 overflow-y-auto">
      <div className="max-w-md mx-auto w-full pt-10">
        <div className="card-glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="h-20 w-20 bg-gradient-to-br from-[#f4540a] to-[#d44808] rounded-3xl flex items-center justify-center shadow-xl">
               <Lock className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center mt-8 mb-10 space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              Nueva <span className="text-[#f4540a]">Contraseña</span>
            </h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Establezca una clave segura para su cuenta de acceso.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold mb-8 animate-pulse text-center">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="py-10 text-center animate-in zoom-in-95 duration-500">
               <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="h-10 w-10 text-green-500" />
               </div>
               <p className="text-xl font-black text-white">¡ACTUALIZADO!</p>
               <p className="text-white/40 text-sm mt-1">Redirigiendo a tu panel...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black text-[#f4540a] uppercase tracking-widest ml-1">Nueva Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="bg-white/5 border-white/10 rounded-2xl h-14 pl-5 pr-12 text-white font-black group-focus-within:border-[#f4540a]/50 transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#f4540a]"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black text-[#f4540a] uppercase tracking-widest ml-1">Confirmar Clave</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                             className="bg-white/5 border-white/10 rounded-2xl h-14 pl-5 pr-12 text-white font-black group-focus-within:border-[#f4540a]/50 transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#f4540a]"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 rounded-[1.5rem] bg-[#f4540a] hover:bg-[#d44808] text-white font-black text-lg transition-transform active:scale-95 shadow-xl shadow-[#f4540a]/20"
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACTUALIZAR CONTRASEÑA"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
} 