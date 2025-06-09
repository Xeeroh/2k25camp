import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UseFormReturn } from 'react-hook-form';

export const useEmailValidation = (form: UseFormReturn<any>, watchedEmail: string) => {
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (watchedEmail && watchedEmail.includes('@') && watchedEmail.includes('.')) {
      setIsCheckingEmail(true);
      
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      emailCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const { count } = await supabase
            .from('attendees')
            .select('id', { count: 'exact' })
            .eq('email', watchedEmail)
            .limit(1);
          
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

  return {
    emailExists,
    isCheckingEmail
  };
}; 