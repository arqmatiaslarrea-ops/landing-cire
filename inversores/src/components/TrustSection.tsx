import { Shield, Eye, Users, FileText } from "lucide-react";

const trustPoints = [
  {
    icon: Shield,
    title: "Capital Protegido",
    description: "Estructura legal clara con garantías definidas desde el inicio del proyecto.",
    gradient: "from-cire-blue-light/20 to-cire-blue/10",
  },
  {
    icon: Eye,
    title: "Transparencia Total",
    description: "Reportes periódicos con acceso al estado real de cada operación.",
    gradient: "from-cire-yellow/15 to-cire-orange/10",
  },
  {
    icon: Users,
    title: "Selección Rigurosa",
    description: "Trabajamos con inversores que entienden el modelo. No es para todos.",
    gradient: "from-cire-orange/15 to-cire-yellow/10",
  },
  {
    icon: FileText,
    title: "Documentación Clara",
    description: "Contratos detallados, proyecciones conservadoras, sin letra pequeña.",
    gradient: "from-cire-blue/15 to-cire-blue-light/10",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-cire-blue-darker via-cire-blue-deep to-cire-blue relative overflow-hidden">
      {/* Decorative gradient elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-cire-orange/8 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cire-yellow/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cire-blue-light/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-cire-yellow-soft uppercase tracking-wider mb-4">
            Nuestra Filosofía
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Confianza basada en{" "}
            <span className="bg-gradient-to-r from-cire-orange-light to-cire-yellow bg-clip-text text-transparent">hechos, no promesas</span>
          </h2>
          <p className="text-lg text-cire-blue-muted max-w-2xl mx-auto">
            No vendemos sueños. Presentamos proyectos con análisis real, riesgos identificados 
            y un proceso probado de ejecución.
          </p>
        </div>

        {/* Trust grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point, index) => (
            <div
              key={point.title}
              className={`group p-8 bg-gradient-to-br ${point.gradient} backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300`}
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                  <point.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    {point.title}
                  </h3>
                  <p className="text-cire-blue-muted leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
