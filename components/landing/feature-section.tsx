import { Landmark, UserPlus, QrCode, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FeatureSection() {
  const features = [
    {
      icon: <Landmark className="h-10 w-10 text-primary" />,
      title: "Evento Principal",
      description: "Un espacio de encuentro para toda la comunidad con actividades inspiradoras."
    },
    {
      icon: <UserPlus className="h-10 w-10 text-primary" />,
      title: "Registro Fácil",
      description: "Proceso de inscripción simple con confirmación inmediata por correo."
    },
    {
      icon: <QrCode className="h-10 w-10 text-primary" />,
      title: "Acceso con Código QR",
      description: "Sistema eficiente de validación de asistentes mediante códigos QR."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: "Administración Integral",
      description: "Herramientas para el seguimiento y gestión del evento."
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Características Principales
        </h2>
        <p className="text-lg text-muted-foreground">
          Ofrecemos una experiencia completa para nuestra comunidad
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-card rounded-lg p-6 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/registro">Regístrate Ahora</Link>
        </Button>
      </div>
    </section>
  );
}