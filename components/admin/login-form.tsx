"use client";

import { useState } from 'react';
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
import { Loader2, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

// Form schema with validation
const formSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { signIn } = useAuth();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setError("");
      console.log('Intentando iniciar sesión con:', data.email);
      await signIn(data.email, data.password);
    } catch (err) {
      console.error('Error detallado al iniciar sesión:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Error desconocido al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-6 w-6 text-primary" />
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6 text-sm">
          {error}
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
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
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
          
          <div className="text-right">
            <Link 
              href="/admin/reset-password" 
              className="text-sm text-primary hover:underline"
            >
              <Lock className="h-4 w-4 inline mr-1" />
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-2" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}