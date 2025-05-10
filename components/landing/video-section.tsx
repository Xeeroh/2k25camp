export default function VideoSection() {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestra Misión</h2>
        <p className="text-lg text-muted-foreground">
          Conozca más sobre MDP Noroeste y nuestra labor en la comunidad
        </p>
      </div>
      
      <div className="aspect-w-16 aspect-h-9 bg-muted rounded-lg overflow-hidden">
        <iframe 
          src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
          title="MDP Noroeste Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-[400px] md:h-[500px]"
        ></iframe>
      </div>
    </section>
  );
}