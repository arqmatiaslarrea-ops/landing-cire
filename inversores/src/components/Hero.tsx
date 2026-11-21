import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroVideo } from "@/components/HeroVideo";

interface HeroProps {
  onCtaClick: () => void;
  onWhatsAppClick: () => void;
}

const RevealBlock = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  // En mobile reducimos los delays para que la entrada se sienta más ágil
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveDelay = isMobile ? Math.round(delay * 0.5) : delay;
  return (
    <div
      className={`opacity-0 animate-reveal-up ${className}`}
      style={{
        animationDelay: `${effectiveDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
};

export const Hero = ({ onCtaClick, onWhatsAppClick }: HeroProps) => {
  const handleWhatsApp = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "whatsapp_click",
        event_category: "CTA",
        event_label: "hero",
      });
    }
    onWhatsAppClick();
  };

  const handleCtaClick = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "form_open",
        event_category: "CTA",
        event_label: "hero",
      });
    }
    onCtaClick();
  };

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero-radial)" }}
      />

      {/* Grid overlay — subtle blueprint effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, #000 10%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, #000 10%, transparent 100%)",
        }}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-tr from-cire-blue-deep/80 to-transparent rounded-full blur-[100px] pointer-events-none" />

<div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center pt-20 md:pt-28">
        {/* ─── Video — después del CTA en mobile, columna derecha en desktop ─── */}
        <div className="col-span-1 lg:col-span-5 order-2 flex justify-center">
          <RevealBlock delay={250} className="w-full flex flex-col items-center gap-4">
            <HeroVideo />
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs text-white/50 max-w-[240px]">
                Tocá el ícono de pantalla completa para verlo en grande.
              </p>
              <button
                type="button"
                onClick={onCtaClick}
                className="text-sm font-semibold text-primary hover:text-primary/80 underline underline-offset-4 transition-colors min-h-[44px]"
                data-gtm="click_cta_video"
              >
                ¿Te interesó? Evaluá tu inversión →
              </button>
            </div>
          </RevealBlock>
        </div>


        {/* ─── Texto ─── */}
        <div className="col-span-1 lg:col-span-7 order-1 flex flex-col items-start gap-5 md:gap-7">
          {/* Badge */}
          <RevealBlock delay={100}>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cire-orange-light to-transparent opacity-50" />
              <span className="w-1.5 h-1.5 bg-cire-orange-light rounded-full shadow-[0_0_8px_hsl(var(--cire-orange-light))] animate-pulse" />
              <span className="text-[11px] font-medium text-white/80 uppercase tracking-[0.15em]">
                Inversión inmobiliaria con método
              </span>
            </div>
          </RevealBlock>

          {/* Headline */}
          <RevealBlock delay={200}>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight text-balance">
              Rentabilidad inmobiliaria{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cire-blue-muted">
                sin gestionar propiedades.
              </span>
            </h1>
          </RevealBlock>

          {/* Subheadline */}
          <RevealBlock delay={350}>
            <p className="text-base md:text-lg text-cire-blue-muted max-w-[50ch] leading-relaxed">
              Oportunidades estructuradas de{" "}
              <span className="text-white font-medium">Fix & Flip</span>:
              máximo retorno, mínima fricción operativa.
            </p>
          </RevealBlock>

          {/* CTAs */}
          <RevealBlock delay={500}>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto mt-2">
              <Button
                variant="hero"
                size="xl"
                onClick={handleCtaClick}
                className="relative overflow-hidden group"
              >
                <span className="relative z-10">Evaluar inversión</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
              </Button>

              <button
                className="flex items-center justify-center gap-3 bg-transparent border border-white/10 text-white font-display font-medium text-base px-6 md:px-8 h-12 md:h-14 rounded-xl hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all duration-300 sm:hidden"
                onClick={handleWhatsApp}
              >
                <span className="w-2 h-2 bg-[#25D366] rounded-full shadow-[0_0_8px_#25D366]" />
                Consultar por WhatsApp
              </button>

              <Button
                variant="heroOutline"
                size="xl"
                className="hidden sm:inline-flex"
                onClick={() =>
                  document
                    .getElementById("method")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Conocer el método
              </Button>
            </div>
          </RevealBlock>

          {/* Trust Indicators — desktop only */}
          <RevealBlock delay={650} className="hidden sm:block w-full">
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 mt-2 w-full">
              {[
                {
                  accent: false,
                  title: "Capital protegido",
                  sub: "Respaldado en activos",
                },
                {
                  accent: true,
                  title: "Proyectos estructurados",
                  sub: "Due diligence exhaustivo",
                },
                {
                  accent: false,
                  title: "Ciclos de 6-12 meses",
                  sub: "Alta liquidez",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 group/trust cursor-default"
                >
                  <div
                    className={`h-[2px] w-6 mb-1 transition-all duration-500 group-hover/trust:w-10 ${
                      item.accent ? "bg-cire-orange-light" : "bg-white/20"
                    }`}
                  />
                  <span className="font-display font-medium text-white text-base">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-cire-blue-muted/60 uppercase tracking-widest font-medium">
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </RevealBlock>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary to-transparent" />
    </section>
  );
};
