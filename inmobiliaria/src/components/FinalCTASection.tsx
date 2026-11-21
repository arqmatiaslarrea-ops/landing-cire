import { ArrowRight, Clock, Shield, CheckCircle } from "lucide-react";

const FinalCTASection = () => {
  return (
    <section id="formulario" className="py-20 md:py-28 bg-background-darker relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Cupo limitado: 1 propiedad por mes
            </span>
          </div>

          {/* Main headline */}
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground text-balance">
            ¿Tu propiedad tiene un problema que nadie quiere resolver?
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analizamos tu caso y en menos de una semana sabremos si somos tus compradores.
            Sin compromiso, sin visitas innecesarias, sin falsas expectativas.
          </p>

          {/* Trust points */}
          <div className="flex flex-wrap justify-center gap-6 py-4">
            {[
              { icon: Clock, text: "Respuesta en 48hs" },
              { icon: Shield, text: "Sin compromiso" },
              { icon: CheckCircle, text: "Oferta en 1 semana" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-foreground">
                <item.icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 gradient-cta text-primary-foreground font-bold text-lg px-10 py-5 rounded-xl shadow-button hover:opacity-90 transition-all duration-300 animate-pulse-glow"
            >
              Consultar mi caso ahora
              <ArrowRight className="w-6 h-6" />
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            Solo analizamos casos en Capital Federal. No todos los barrios aplican.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
