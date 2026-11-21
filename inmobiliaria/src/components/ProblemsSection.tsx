import { Home, Scale, TrendingDown, Users } from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "Heredaste y no sabés qué hacer",
    description: "Sucesiones trabadas, conflictos familiares, trámites interminables. Compramos en el estado actual y nos ocupamos del problema completo.",
    symptoms: ["Sucesión sin cerrar", "Familia en desacuerdo", "Propiedad abandonada"],
  },
  {
    icon: Home,
    title: "La propiedad necesita mucha obra",
    description: "Humedades, instalaciones viejas, deterioro general. No pedimos arreglos previos ni bajamos precio por cada defecto.",
    symptoms: ["Sin presupuesto para reparar", "Inmobiliaria pide bajar precio", "Nadie quiere comprar"],
  },
  {
    icon: Scale,
    title: "Tiene problemas legales",
    description: "Ocupantes, deudas, usufructo, embargos parciales. Analizamos casos complejos y estructuramos soluciones legales flexibles.",
    symptoms: ["Operaciones caídas", "Abogados sin solución", "Años sin poder vender"],
  },
  {
    icon: TrendingDown,
    title: "Una inversión que no funcionó",
    description: "Compraste para alquilar o revender y el negocio no cerró. Te damos una salida rápida, realista y sin exposición.",
    symptoms: ["Rentabilidad baja", "Cansado de renegar", "Quiero cerrar este capítulo"],
  },
];

const ProblemsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background-dark">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Si tu propiedad tiene alguno de estos problemas,{" "}
            <span className="gradient-text">hablemos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Compramos propiedades que otros rechazan. Si sentís que nadie entiende 
            tu situación, probablemente nosotros sí.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="gradient-card rounded-2xl p-6 md:p-8 shadow-card border border-border/30 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 group-hover:shadow-glow transition-shadow duration-300">
                  <problem.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-display font-bold text-foreground">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {problem.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {problem.symptoms.map((symptom, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
