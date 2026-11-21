import { Phone, CalendarDays } from "lucide-react";
import { suppressExitIntent } from "@/hooks/useExitIntent";
import { openWhatsApp } from "@/lib/whatsapp";

const WHATSAPP_NUMBER = "5491154950446";
const DISPLAY_NUMBER = "+54 9 11 5495-0446";
const BOOKING_URL = "https://calendar.app.google/2j6hvEEhS7o5LcF69";

export const ContactSection = () => {
  const handleClick = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "whatsapp_click",
        event_category: "CTA",
        event_label: "contact_section",
      });
    }
    suppressExitIntent();
    openWhatsApp(
      WHATSAPP_NUMBER,
      "Hola, me interesa conocer más sobre las oportunidades de inversión con CIRE.",
    );
  };

  const handleSchedule = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "schedule_click",
        event_category: "CTA",
        event_label: "contact_section",
      });
    }
    suppressExitIntent();
    window.open(BOOKING_URL, "_blank", "noopener,noreferrer");
  };


  return (
    <section className="py-16 md:py-20 bg-secondary/30 border-t border-white/5">
      <div className="container max-w-2xl text-center flex flex-col items-center gap-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          ¿Preferís hablar directamente?
        </h2>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
          Si tenés un monto importante para invertir y preferís una conversación
          personalizada, contactanos por WhatsApp. Sin formularios, sin esperas.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button
            onClick={handleClick}
            data-gtm="click_whatsapp"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/50 transition-all duration-300 group"
          >
            <span className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center group-hover:bg-[#25D366]/25 transition-colors">
              <Phone className="w-5 h-5 text-[#25D366]" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                WhatsApp directo
              </span>
              <span className="font-display text-lg text-foreground font-semibold tracking-wide">
                {DISPLAY_NUMBER}
              </span>
            </div>
          </button>

          <button
            onClick={handleSchedule}
            data-gtm="click_schedule"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group"
          >
            <span className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <CalendarDays className="w-5 h-5 text-primary" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Agendar reunión
              </span>
              <span className="font-display text-lg text-foreground font-semibold tracking-wide">
                Arq. Matías Larrea
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
