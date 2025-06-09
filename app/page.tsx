import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeroSlider from '@/components/landing/hero-slider';
import VideoSection from '@/components/landing/video-section';
import AboutSection from '@/components/landing/about-section';
import FeatureSection from '@/components/landing/feature-section';
import FooterL from '@/components/shared/footerL';
import Navbar from '@/components/shared/navbar';

export default function Home() {
  return (
    <main className="relative h-screen bg-cover bg-center bg-no-repeat"
    style={{backgroundImage: "url('https://res.cloudinary.com/dmjdrou6a/image/upload/v1749485060/Fondo_1_czgmbm.png')",}}
    >
      <Navbar showInternalLinks={false} />

       {/* Logo centra */}
       <div className="absolute inset-0 flex justify-center items-center z-10">
        <Link href="/registro">
          <img
            src="https://res.cloudinary.com/dmjdrou6a/image/upload/v1749238690/Alfa_y_Omega_lj3vsb.png"
            alt="Alfa y Omega"
            className="w-[300px] md:w-[500px] hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </Link>
      </div>

      <FooterL/>
    </main>
  );
}