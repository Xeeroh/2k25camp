"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/268941/pexels-photo-268941.jpeg",
    title: "Unidos en fe",
    description: "Celebrando nuestra comunidad de fe en el noroeste"
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg",
    title: "Fortaleciendo lazos",
    description: "Construyendo vínculos que trascienden fronteras"
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/372326/pexels-photo-372326.jpeg",
    title: "Creciendo juntos",
    description: "Aprendiendo y desarrollándonos como comunidad"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };
  
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            currentSlide === index ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="absolute inset-0 bg-black/50 z-10" />
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center text-white max-w-3xl px-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </h2>
              <p className="text-xl md:text-2xl mb-8 animate-fade-in animation-delay-200">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Controls */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-black/20"
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-black/20"
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </Button>
      
      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              currentSlide === index 
                ? "bg-white w-6" 
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}