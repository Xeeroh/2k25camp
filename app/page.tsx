import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import HeroSlider from '@/components/landing/hero-slider';
import VideoSection from '@/components/landing/video-section';
import AboutSection from '@/components/landing/about-section';
import FeatureSection from '@/components/landing/feature-section';
import Footer from '@/components/shared/footer';
import Navbar from '@/components/shared/navbar';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <HeroSlider />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Mensajeros de Paz Distrito Noroeste
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Fortaleciéndonos en comunidad para servir con propósito y amor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-lg">
              <Link href="/registro">Registrarse</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="#about">Conocer más</Link>
            </Button>
          </div>
        </section>
        
        <AboutSection />
        
        <VideoSection />
        
        <FeatureSection />
      </div>
      
      <Footer />
    </main>
  );
}