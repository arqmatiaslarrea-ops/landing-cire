import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Martín D.",
    role: "Inversor desde 2022",
    capitalInicial: "USD 50.000",
    capitalFinal: "USD 66.550",
    quote: "Recuperé mi capital y ganamos siempre más del 10% en cada proyecto. Ya hicimos 3 operaciones juntos y volvería a invertir con ellos.",
    projects: 3,
  },
  {
    name: "Carolina S.",
    role: "Primera inversión",
    capitalInicial: "USD 25.000",
    capitalFinal: "USD 28.000",
    quote: "Tenía dudas de entrar con poco capital, pero el equipo me explicó todo. En 6 meses vi el retorno que esperaba.",
    projects: 1,
  },
  {
    name: "Federico L.",
    role: "Inversor recurrente",
    capitalInicial: "USD 150.000",
    capitalFinal: "USD 222.000",
    quote: "Probé con renta fija y bolsa. Nada me dio la combinación de retorno y seguridad que encontré acá.",
    projects: 4,
  },
  {
    name: "Luciana M.",
    role: "Inversora desde 2023",
    capitalInicial: "USD 80.000",
    capitalFinal: "USD 99.200",
    quote: "Lo que más me gustó es que puedo seguir cada proyecto. No es plata que desaparece, siempre sé dónde está.",
    projects: 2,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-warm-50 to-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-cire-blue-light uppercase tracking-wider mb-4">
            Prueba Social
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-cire-blue-deep mb-6">
            Inversores que{" "}
            <span className="bg-gradient-to-r from-cire-blue to-cire-blue-light bg-clip-text text-transparent">ya confiaron en CIRE</span>
          </h2>
          <p className="text-lg text-warm-400 max-w-2xl mx-auto">
            Resultados reales de personas que decidieron invertir de forma diferente.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative p-8 bg-white rounded-2xl border border-warm-100 hover:border-cire-blue/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-10 h-10 text-cire-blue/10 group-hover:text-cire-blue/20 transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-cire-yellow text-cire-yellow" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-cire-blue-deep mb-6 leading-relaxed min-h-[72px]">
                "{testimonial.quote}"
              </p>

              {/* Stats */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="p-4 bg-gradient-to-br from-cire-blue/8 to-cire-blue-light/5 rounded-xl border border-cire-blue/15">
                  <p className="text-xs text-warm-400 mb-1">Convirtió</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-cire-blue-deep">{testimonial.capitalInicial}</span>
                    <span className="text-cire-blue font-bold mx-2">→</span>
                    <span className="font-display text-lg font-bold text-cire-blue">{testimonial.capitalFinal}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-warm-50 rounded-lg text-center">
                    <p className="font-display text-xl font-bold text-cire-blue-deep">{testimonial.projects}</p>
                    <p className="text-xs text-warm-400">Proyectos</p>
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cire-blue to-cire-blue-light flex items-center justify-center">
                  <span className="font-display text-lg font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-cire-blue-deep">{testimonial.name}</p>
                  <p className="text-sm text-warm-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
