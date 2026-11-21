import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CtaSectionProps {
  onCtaClick: () => void;
}

export const CtaSection = ({ onCtaClick }: CtaSectionProps) => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="relative max-w-4xl mx-auto p-12 md:p-16 bg-gradient-to-br from-cire-blue-deep via-cire-blue to-cire-blue-light rounded-3xl overflow-hidden">
          {/* Decorative gradient elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cire-orange/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cire-yellow/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cire-blue-light/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para explorar una{" "}
              <span className="bg-gradient-to-r from-cire-orange-light to-cire-yellow bg-clip-text text-transparent">nueva forma de invertir</span>?
            </h2>
            <p className="text-lg text-cire-blue-muted mb-8 max-w-xl mx-auto">
              No es para todos. Pero si buscás rentabilidad inmobiliaria sin el desgaste 
              de la gestión directa, podemos tener una conversación.
            </p>
            <Button variant="hero" size="xl" onClick={onCtaClick}>
              Quiero saber más
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
