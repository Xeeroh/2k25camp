import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  church: string;
  sector: string;
  tshirtsize?: string;
  paymentReceipt: File | null;
}

export const useRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      onProgress: (progress: number) => {
        setUploadProgress(Math.round(progress * 50));
      },
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
      return file;
    }
  };

  const uploadPaymentReceipt = async (file: File): Promise<string | null> => {
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      setUploadProgress(50);
      
      const { data, error } = await supabase.storage
        .from('payment-receipts/payment-receipts')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts/payment-receipts')
        .getPublicUrl(fileName);
      
      setUploadProgress(100);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error en uploadPaymentReceipt:', error);
      return null;
    }
  };

  const submitRegistration = async (data: RegistrationData) => {
    setIsSubmitting(true);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!data.paymentReceipt) {
        throw new Error("El comprobante de pago es obligatorio");
      }
      
      const receiptUrl = await uploadPaymentReceipt(data.paymentReceipt);
      if (!receiptUrl) {
        throw new Error("Error al subir el comprobante de pago. Por favor intenta de nuevo.");
      }

      const { count } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true });
      
      const canReceiveTshirt = count !== null && count < 100;

      const registrationData = {
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.email,
        phone: data.phone,
        church: data.church,
        sector: data.sector,
        registrationdate: new Date().toISOString(),
        tshirtsize: data.tshirtsize || null,
        receives_tshirt: canReceiveTshirt,
        paymentreceipturl: receiptUrl,
        paymentamount: 0,
      };
      
      const { data: attendeeData, error } = await supabase
        .from('attendees')
        .insert([registrationData])
        .select()
        .single();

      if (error) throw error;

      const qrValue = `id:${attendeeData.id}`;

      // Enviar correo de confirmación
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
        }
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
      }

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

      return { attendeeData, qrValue };
    } catch (error: any) {
      setError(error.message || 'Ha ocurrido un error al procesar tu registro.');
      toast.error("Error al guardar el registro");
      throw error;
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    isSubmitting,
    error,
    uploadProgress,
    submitRegistration
  };
}; 