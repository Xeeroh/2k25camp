"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from '@/components/shared/navbar';
import FooterL from '@/components/shared/footerL';
import RegistrationForm from '@/components/registration/registration-form';
import { SuccessMessage } from '@/components/registration/success-message'

interface AttendeeData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  church: string;
  sector: string;
  paymentamount: number;
  paymentstatus: string;
  registrationdate: string;
  paymentreceipturl: string;
}

export default function RegistroPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [registroCerrado, setRegistroCerrado] = useState(false);

  useEffect(() => {
    // Fecha límite: 15 de julio de 2025, 23:59:59
    const fechaLimite = new Date('2025-07-15T23:59:59');
    const ahora = new Date();
    if (ahora > fechaLimite) {
      setRegistroCerrado(true);
    }
  }, []);

  const handleSuccessfulSubmission = (data: AttendeeData, qrCode: string) => {
    console.log('RegistroPage - handleSuccessfulSubmission recibió:');
    console.log('- data:', data);
    console.log('- qrCode:', qrCode);
    
    // Usar directamente el qrCode si existe
    if (qrCode) {
      console.log('RegistroPage - Usando qrCode recibido directo del formulario');
      setQrData(qrCode);
    } else {
      // Fallback: crear un formato similar al esperado
      console.log('RegistroPage - Creando un nuevo objeto QR a partir de los datos');
      const fallbackQrData = {
        id: data.id,
        nombre: `${data.firstname} ${data.lastname}`,
        email: data.email,
        iglesia: data.church,
        sector: data.sector,
        monto: data.paymentamount,
        estado: data.paymentstatus,
        fecha: data.registrationdate
      };
      setQrData(JSON.stringify(fallbackQrData));
    }
    
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-try ">
      <Navbar showInternalLinks={false} />
      
      <div className="flex-1 py-12 bg-muted/30 bg-try">
        {registroCerrado ? (
          <div className="flex flex-1 min-h-[60vh] items-center justify-center">
            <div className="text-center mt-20 mb-20 p-8 card-glass rounded-xl shadow-lg">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-blue-200">🕔 ¡El registro en linea ha finalizado! 🕔</h1>
              <p className="text-lg text-blue-100 mb-4">🚫 El registro en línea está cerrado, pero aún puedes ser parte del campamento .</p>
              <p className="text-md text-blue-100 mb-2"> 🏕️ Solo llega el día del evento y 📝 regístrate directamente en el área de bienvenida.
              ¡Nos encantaría verte ahí!</p>
              <p className="text-md text-blue-100"> 👋🏼 ¡Nos vemos pronto!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {isSubmitted ? (
              <SuccessMessage 
                qrData={qrData} 
                onReset={() => {
                  setIsSubmitted(false);
                  setQrData(null);
                }} 
              />
            ) : (
              <>
                <div className="text-center mb-10 ">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    Registro Campamento 2025 "Alfa y Omega"
                  </h1>
                  <p className="text-lg text-muted-foreground ">
                    Complete el formulario para registrarse
                  </p>
                </div>
                <RegistrationForm onSuccess={handleSuccessfulSubmission} />
              </>
            )}
          </div>
        )}
      </div>
      
      <FooterL />
    </div>
  );
}