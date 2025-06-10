import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface PaymentReceiptFieldProps {
  form: any;
  isLoading: boolean;
  isSubmitting: boolean;
  uploadProgress: number;
  onFileChange: (file: File | null) => void;
  paymentReceiptFile: File | null;
}

export const PaymentReceiptField = ({
  form,
  isLoading,
  isSubmitting,
  uploadProgress,
  onFileChange,
  paymentReceiptFile
}: PaymentReceiptFieldProps) => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobileDevice(mobile);
    };
    
    checkIfMobile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
      form.setValue('paymentReceipt', file, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
    }
  };

  return (
    <FormItem>
      <FormLabel>Comprobante de Pago *</FormLabel>
      <FormControl>
        <div className="flex flex-col space-y-2">
          {isMobileDevice ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-blue-600/50 flex items-center justify-center text-sm p-2 h-auto space-y-1 flex-col py-3"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files[0]) {
                      handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
                    }
                  };
                  input.click();
                }}
                disabled={isLoading || isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Tomar Foto</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-blue-600/50 flex items-center justify-center text-sm p-2 h-auto space-y-1 flex-col py-3"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files[0]) {
                      handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
                    }
                  };
                  input.click();
                }}
                disabled={isLoading || isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Galería</span>
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <label className="block">
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-primary cursor-pointer transition-colors">
                  <div className="flex flex-col items-center space-y-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">Haz clic para seleccionar una imagen</span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF (máx. 10MB)</span>
                  </div>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading || isSubmitting}
                    required
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          )}
          {paymentReceiptFile && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">
                Archivo seleccionado: {paymentReceiptFile.name} ({Math.round(paymentReceiptFile.size / 1024)} KB)
              </p>
              <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                <img 
                  src={URL.createObjectURL(paymentReceiptFile)} 
                  alt="Vista previa del comprobante" 
                  className="w-full h-full object-contain"
                  onLoad={() => URL.revokeObjectURL(URL.createObjectURL(paymentReceiptFile))}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  onClick={() => {
                    onFileChange(null);
                    form.setValue('paymentReceipt', null);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {uploadProgress > 0 && (
            <div className="w-full">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadProgress < 100 ? `Procesando: ${uploadProgress}%` : 'Carga completa'}
              </p>
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
      <p className="text-xs text-muted-foreground mt-1">
        Sube una imagen de tu comprobante de pago
      </p>
    </FormItem>
  );
}; 