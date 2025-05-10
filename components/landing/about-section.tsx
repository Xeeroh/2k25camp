export default function AboutSection() {
  return (
    <section id="about" className="py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sobre MDP Noroeste
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            MDP Noroeste es una organización religiosa dedicada a fortalecer la comunidad
            cristiana en la región noroeste. Nuestra visión es crear un espacio de encuentro,
            crecimiento espiritual y servicio a la comunidad.
          </p>
          <p className="text-lg text-muted-foreground">
            A través de diferentes actividades y eventos, buscamos fomentar los valores
            cristianos, la unidad entre iglesias y el desarrollo personal de cada miembro
            de nuestra comunidad.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-6 transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold mb-2">Misión</h3>
            <p>Fortalecer la comunidad cristiana a través de la unidad y el servicio.</p>
          </div>
          
          <div className="bg-muted rounded-lg p-6 transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold mb-2">Visión</h3>
            <p>Ser un referente de fe, esperanza y amor en la región noroeste.</p>
          </div>
          
          <div className="bg-muted rounded-lg p-6 transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold mb-2">Valores</h3>
            <p>Fe, comunidad, servicio, integridad y compromiso.</p>
          </div>
          
          <div className="bg-muted rounded-lg p-6 transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold mb-2">Comunidad</h3>
            <p>Más de 60 iglesias unidas por un propósito común.</p>
          </div>
        </div>
      </div>
    </section>
  );
}