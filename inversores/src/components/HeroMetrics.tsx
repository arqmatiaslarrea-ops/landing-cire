import { useCountUp } from "@/hooks/useCountUp";

const CheckIcon = () => (
  <svg className="w-4 h-4 text-[#25D366] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const HeroMetrics = () => {
  const roi = useCountUp({ end: 16, duration: 2000, delay: 300, suffix: "%", decimals: 0 });
  const plazo = useCountUp({ end: 12, duration: 1800, delay: 500, suffix: "", decimals: 0 });

  return (
    <section className="relative bg-secondary py-12 md:py-16">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-1.5 h-1.5 bg-cire-orange-light rounded-full animate-pulse" />
          <span className="text-[11px] text-cire-orange-light uppercase tracking-[0.2em] font-medium">
            Caso de estudio — Proyecto Fix & Flip finalizado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
          <div className="flex flex-col gap-1 border-l-2 border-cire-orange-light pl-5">
            <span
              ref={roi.ref as React.RefObject<HTMLSpanElement>}
              className="font-display text-4xl md:text-5xl font-semibold text-white tabular-nums"
            >
              {roi.value}
            </span>
            <span className="text-sm text-cire-blue-muted">
              Rentabilidad obtenida en 1 año
            </span>
          </div>

          <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-5">
            <span className="font-display text-4xl md:text-5xl font-semibold text-white tabular-nums">
              <span ref={plazo.ref as React.RefObject<HTMLSpanElement>}>{plazo.value}</span>
              <span className="text-xl text-cire-blue-muted font-medium ml-2">meses</span>
            </span>
            <span className="text-sm text-cire-blue-muted">Plazo total del ciclo</span>
          </div>

          <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-5">
            <span className="flex items-center gap-2 font-display text-xl md:text-2xl font-medium text-white pt-2">
              <CheckIcon /> Capital devuelto
            </span>
            <span className="text-sm text-cire-blue-muted">
              Ciclo completado al 100%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
