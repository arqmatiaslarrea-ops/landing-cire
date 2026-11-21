import { Check, X, TrendingUp, Percent, Clock, Target } from "lucide-react";
import cireLogo from "@/assets/cire-logo.png";
const comparisons = [
  {
    traditional: "Renta fija: 4-6% anual con capital atado",
    cire: "17-24% anual proyectado con ciclos de 6 meses",
    icon: Percent,
  },
  {
    traditional: "Renta variable: volatilidad y riesgo de pérdida",
    cire: "Activo real con valor tangible y estrategia de salida clara",
    icon: TrendingUp,
  },
  {
    traditional: "Fondos de inversión: comisiones ocultas y poca transparencia",
    cire: "Proyecciones claras basadas en análisis de mercado real",
    icon: Target,
  },
  {
    traditional: "Renta variable según el esquema macroeconómico (hace no mucho tenían rendimiento real negativo)",
    cire: "Ciclos cortos de 6 meses con visibilidad completa",
    icon: Clock,
  },
];

export const WhyInvest = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-cire-blue-light uppercase tracking-wider mb-4">
            ¿Por qué CIRE?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Otras alternativas de inversión vs{" "}
            <span className="inline-flex items-baseline gap-2 bg-gradient-to-r from-primary to-cire-orange bg-clip-text text-transparent">
              <img src={cireLogo} alt="CIRE" className="h-12 md:h-14 inline-block self-center brightness-0" style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(5000%) hue-rotate(11deg) brightness(101%) contrast(106%)" }} />
              Fix & Flip
            </span>
          </h2>
          <p className="text-lg text-warm-400 max-w-3xl mx-auto">
            Nuestros proyectos rinden <span className="font-semibold text-cire-orange">8.5-12% en 6 meses</span>, 
            equivalente a <span className="font-semibold text-cire-orange">17-24% anualizado</span>.
            Sin la volatilidad del mercado financiero.
          </p>
        </div>

        {/* Comparison table */}
        <div className="max-w-4xl mx-auto">
          {/* Headers */}
          <div className="grid grid-cols-2 gap-4 mb-6 px-6">
            <div className="text-center">
              <span className="text-sm font-semibold text-warm-400 uppercase tracking-wider">
                Inversión pasiva tradicional
              </span>
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold text-cire-blue uppercase tracking-wider">
                Con CIRE Fix & Flip
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-4">
            {comparisons.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Traditional */}
                <div className="flex items-start gap-4 p-6 bg-warm-50 rounded-xl border border-warm-100">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-warm-200">
                    <X className="w-4 h-4 text-warm-400" />
                  </div>
                  <p className="text-warm-400">{row.traditional}</p>
                </div>

                {/* CIRE */}
                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-cire-blue/5 to-cire-blue-light/5 rounded-xl border border-cire-blue/20">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cire-blue to-cire-blue-light">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-cire-blue-deep font-medium">{row.cire}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight callout for small investors */}
        <div className="max-w-3xl mx-auto mt-16 p-8 bg-gradient-to-br from-cire-blue-deep via-cire-blue to-cire-blue-light rounded-2xl text-center relative overflow-hidden">
          {/* Decorative overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-cire-orange/10 via-transparent to-cire-yellow/10" />
          
          <div className="relative z-10">
            <p className="text-cire-blue-muted text-sm uppercase tracking-wider mb-3">Para inversores con capital inicial</p>
            <p className="font-display text-xl md:text-2xl font-bold text-white mb-4">
              ¿Sabías que <span className="text-cire-yellow-soft">USD 20.000</span> invertidos durante 7 años 
              en Fix & Flip pueden convertirse en <span className="text-cire-yellow-soft">USD 72.000</span>?
            </p>
            <p className="text-cire-blue-muted">
              Convertite en propietario y dejá de alquilar. El interés compuesto trabaja para vos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
