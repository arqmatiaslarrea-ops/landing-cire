import { Search, FileCheck, Hammer, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Identificación",
    description: "Analizamos el mercado para encontrar propiedades con potencial de revalorización real.",
    gradient: "from-cire-blue/10 to-cire-blue-light/5",
  },
  {
    icon: FileCheck,
    number: "02",
    title: "Evaluación",
    description: "Due diligence exhaustivo. Solo avanzamos con proyectos que cumplen nuestros criterios de riesgo.",
    gradient: "from-cire-blue-light/10 to-cire-yellow/5",
  },
  {
    icon: Hammer,
    number: "03",
    title: "Ejecución",
    description: "Renovación controlada con presupuestos cerrados y cronogramas definidos.",
    gradient: "from-cire-yellow/10 to-cire-orange/5",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "Salida en 90 días",
    description: "Vendemos a precios competitivos para cerrar la operación en máximo 90 días desde la publicación.",
    gradient: "from-cire-orange/10 to-cire-orange-light/5",
  },
];

export const Method = () => {
  return (
    <section id="method" className="py-24 bg-gradient-to-b from-warm-50 to-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-cire-blue-light uppercase tracking-wider mb-4">
            El Método
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-cire-blue-deep mb-6">
            Proceso estructurado,{" "}
            <span className="bg-gradient-to-r from-cire-orange to-cire-orange-deep bg-clip-text text-transparent">riesgo controlado</span>
          </h2>
          <p className="text-lg text-warm-400 max-w-2xl mx-auto">
            Cada proyecto sigue un proceso riguroso diseñado para proteger el capital 
            y maximizar las oportunidades de retorno.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`group relative p-8 bg-gradient-to-br ${step.gradient} rounded-2xl border border-warm-200 hover:border-cire-orange/30 hover:shadow-lg transition-all duration-300`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Step number */}
              <span className="absolute top-6 right-6 font-display text-5xl font-bold text-cire-blue/10 group-hover:text-cire-orange/20 transition-colors">
                {step.number}
              </span>

              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-white shadow-soft group-hover:shadow-md transition-all">
                <step.icon className="w-7 h-7 text-cire-blue" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-cire-blue-deep mb-3">
                {step.title}
              </h3>
              <p className="text-warm-400 leading-relaxed">
                {step.description}
              </p>

              {/* Connector line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-warm-200 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
