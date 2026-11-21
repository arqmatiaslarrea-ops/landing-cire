import { Target, Wrench, Calculator, Zap, ArrowRight } from "lucide-react";

const differentials = [
  {
    icon: Target,
    title: "Somos compradores, no intermediarios",
    description: "No tasamos para terceros. No hacemos visitas masivas. Te damos una oferta concreta en 48 horas para cerrar en 45 días.",
  },
  {
    icon: Wrench,
    title: "Compramos el problema completo",
    description: "Técnico, legal, emocional. No te pedimos que arregles nada antes de vender. Nosotros asumimos el riesgo y la gestión.",
  },
  {
    icon: Calculator,
    title: "Sabemos calcular riesgo",
    description: "Entendemos de obra, costos ocultos, riesgos jurídicos e inversión. Por eso podemos hacer ofertas que otros no pueden.",
  },
  {
    icon: Zap,
    title: "Estructuras de cierre flexibles",
    description: "Compra directa, opción a plazo, aportes. Cada caso es único y diseñamos la estructura que mejor funcione para ambos.",
  },
];

const DifferentialsSection = () => {
  return (
    <section className="py-20 md:py-28 gradient-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Por qué somos diferentes
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3 mb-4">
                No prometemos el precio máximo.{" "}
                <span className="gradient-text">Prometemos una salida.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Trabajamos diferente porque compramos diferente. Nuestro negocio 
                es resolver problemas que otros no quieren tocar.
              </p>
            </div>

            <div className="space-y-4">
              {differentials.map((diff, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <diff.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {diff.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {diff.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Highlight box */}
          <div className="gradient-card rounded-2xl p-8 md:p-10 shadow-card border border-primary/20">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-3xl font-display font-bold text-primary-foreground">48h</span>
              </div>
              
              <h3 className="text-2xl font-display font-bold text-foreground">
                Oferta concreta en menos de 48 horas
              </h3>
              
              <p className="text-muted-foreground">
                Si tu propiedad encaja con nuestro perfil de compra, no vas a esperar 
                semanas para saber si te podemos ayudar. En 48 horas hábiles tenés 
                una respuesta clara.
              </p>

              <ul className="space-y-3">
                {[
                  "Análisis rápido de tu situación",
                  "Decisión clara: sí o no",
                  "Sin falsas expectativas",
                  "Proceso escrito y transparente",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#formulario"
                className="inline-flex items-center gap-2 gradient-cta text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-button hover:opacity-90 transition-opacity"
              >
                Quiero una oferta
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DifferentialsSection;
