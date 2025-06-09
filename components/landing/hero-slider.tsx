"use client";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/32069316/pexels-photo-32069316.png",
    title: "Alfa y Omega",
    description: "Campamento 2025",
    accent: "Transformando vidas"
  },
  {
    id: 2,
    image: "https://res.cloudinary.com/dmjdrou6a/image/upload/Fnd_Top_lpghxw.png",
    title: "Fortaleciendo lazos",
    description: "Construyendo vínculos que trascienden fronteras",
    accent: "Comunidad unida"
  },
  {
    id: 3,
    image: "https://scontent-lax3-1.xx.fbcdn.net/v/t39.30808-6/490352268_716198944309066_7273972250481593362_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeHDHdcnmqMDU8lTIyd8-yjicNnBC3XjkHpw2cELdeOQemS4prdE43jkRU3XPY68BvY_e1wkxApgAwEuHv6DsCC2&_nc_ohc=ZX-MChuKM2oQ7kNvwFyB5bM&_nc_oc=Adl7tAbbOSdi7DFTarAeRTI50Qkn5trE6RL907PwFE-Jiy0D8HynULTvWV6IrAJIzck&_nc_zt=23&_nc_ht=scontent-lax3-1.xx&_nc_gid=8a1ceG2duCmFOzW-3iF2XQ&oh=00_AfKopkwkjF9UIAXzdteahvnEbW3kNwevweU-5dYIXfNEIQ&oe=684659BC",
    title: "Creciendo juntos",
    description: "Aprendiendo y desarrollándonos como comunidad",
    accent: "Crecimiento personal"
  }
];



export default function ModernHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up-1 {
          animation: slideUp 0.8s ease-out 0.2s forwards;
        }
        
        .slide-up-2 {
          animation: slideUp 0.8s ease-out 0.4s forwards;
        }
        
        .slide-up-3 {
          animation: slideUp 0.8s ease-out 0.6s forwards;
        }
        
        .slide-up-4 {
          animation: slideUp 0.8s ease-out 0.8s forwards;
        }
      `}</style>
      
      <div className="relative">
        {/* Main slider container with modern proportions */}
        <div className="relative h-[80vh] min-h-[500px] max-h-[700px] overflow-hidden rounded-3xl mx-4 lg:mx-8 mt-8 shadow-2xl">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-900 ease-out ${
                currentSlide === index 
                  ? "opacity-100 scale-100" 
                  : "opacity-0 scale-110"
              }`}
            >
              {/* Gradient overlay with modern styling */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent z-10" />
              
              {/* Background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                style={{ 
                  backgroundImage: `url(${slide.image})`,
                  transform: currentSlide === index ? 'scale(1)' : 'scale(1.1)'
                }}
              />

              {/* Content with modern layout */}
              <div className="absolute inset-0 flex items-center z-20">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 w-full">
                  <div className="max-w-2xl">
                    {/* Accent badge */}
                    {/* <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-6 transform translate-y-4 opacity-0 slide-up-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                      {slide.accent}
                    </div> */}

                    {/* Main title */}
                    {/* <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight transform translate-y-4 opacity-0 slide-up-2">
                      {slide.title}
                    </h1> */}

                    {/* Description */}
                   {/*} <p className="text-xl lg:text-2xl text-white/90 mb-8 font-light leading-relaxed transform translate-y-4 opacity-0 slide-up-3">
                      {slide.description}
                    </p>*/}

                    {/* CTA Buttons */}
                    {/* <div className="flex flex-wrap gap-4 transform translate-y-4 opacity-0 slide-up-4">
                      <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg">
                        Únete ahora
                      </button>
                      <button className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                        Conoce más
                      </button>
                    </div> */}

                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Modern navigation controls */}
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
          >
            <ChevronLeft size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
          >
            <ChevronRight size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Auto-play control */}
          <button
            onClick={toggleAutoPlay}
            className="absolute top-6 right-6 z-30 w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
          >
            {isAutoPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-425 transition-all duration-200 ease-linear"
              style={{
                width: `${((currentSlide + 1) / slides.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Modern indicators outside the image */}
        <div className="flex justify-center mt-8 space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="group relative"
            >
              <div className={`w-12 h-1 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'bg-black' 
                  : 'bg-gray-300 group-hover:bg-gray-400'
              }`} />
              {currentSlide === index && (
                <div className="absolute inset-0 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}