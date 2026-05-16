import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface AttendeeInput {
  firstName: string;
  lastName: string;
  tshirtsize?: string;
}

export interface RegistrationData {
  email: string;
  phone: string;
  church: string;
  sector: string;
  paymentReceipt: File | null;
  attendees: AttendeeInput[];
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
      
      let currentCount = count || 0;
      
      // Generate a group_id if there are multiple people, or even for 1 to keep it consistent
      const groupId = crypto.randomUUID();
      const isGroup = data.attendees.length > 1;

      const registrationRecords = data.attendees.map(att => {
        const canReceiveTshirt = currentCount < 100;
        currentCount++;
        
        return {
          firstname: att.firstName,
          lastname: att.lastName,
          email: data.email,
          phone: data.phone,
          church: data.church,
          sector: data.sector,
          registrationdate: new Date().toISOString(),
          tshirtsize: att.tshirtsize || null,
          receives_tshirt: canReceiveTshirt,
          paymentreceipturl: receiptUrl,
          paymentamount: 0,
          group_id: groupId,
        };
      });
      
      const { data: insertedAttendees, error } = await supabase
        .from('attendees')
        .insert(registrationRecords)
        .select();

      if (error) throw error;

      // The QR code for the group will be group:groupId if it's a group, or id:id if it's single
      // To keep it simple, we can always use group:groupId or stick to id:id for single.
      const qrValue = isGroup ? `group:${groupId}` : `id:${insertedAttendees[0].id}`;

      // We need to send an email. For groups, we send a single email.
      try {
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: data.email,
            church: data.church,
            sector: data.sector,
            qrData: qrValue,
            isGroup: isGroup,
            attendees: insertedAttendees.map(a => ({
              firstName: a.firstname,
              lastName: a.lastname,
              receivesTshirt: a.receives_tshirt,
              tshirtSize: a.tshirtsize
            })),
            // Fallback for single email template
            firstName: insertedAttendees[0].firstname,
            lastName: insertedAttendees[0].lastname,
            receivesTshirt: insertedAttendees[0].receives_tshirt,
            tshirtSize: insertedAttendees[0].tshirtsize
          }
        });
        if (invokeError) {
          console.error("❌ Error desde Supabase Edge Function:", invokeError);
        } else {
          console.log("✅ Correo enviado desde el cliente:", invokeData);
        }
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
      }

      toast.success(isGroup ? "¡Registro grupal completado con éxito!" : "¡Registro completado con éxito!");
      
      if ((window as any).gtag) {
        (window as any).gtag('event', 'sign_up', {
          method: 'form',
          event_category: 'engagement',
          event_label: isGroup ? 'Group Registration Success' : 'Registration Success',
          email: data.email,
          church: data.church,
          sector: data.sector,
          qrData: qrValue
        });
      }

      return { attendeeData: insertedAttendees[0], qrValue };
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