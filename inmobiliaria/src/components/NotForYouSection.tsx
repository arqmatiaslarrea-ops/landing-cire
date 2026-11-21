import { XCircle, ArrowRight } from "lucide-react";

const notForList = [
  "Buscás el precio máximo de mercado sin importar el tiempo",
  "Podés esperar meses o años para vender",
  "Querés 'probar suerte' a ver si alguien paga de más",
  "La propiedad está fuera de Capital Federal",
  "Tiene un embargo judicial activo",
];

const NotForYouSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background-dark">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-card rounded-2xl p-8 md:p-12 shadow-card border border-accent/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Warning content */}
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-accent" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Esto NO es para vos si...
                </h2>
                
                <p className="text-muted-foreground">
                  Somos claros desde el principio. No trabajamos con todos los casos 
                  y preferimos decírtelo antes de hacerte perder el tiempo.
                </p>
              </div>

              {/* Right: List */}
              <div className="space-y-3">
                {notForList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-border/30"
                  >
                    <XCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 pt-8 border-t border-border/30 text-center">
              <p className="text-muted-foreground mb-4">
                Si ninguno de estos puntos te describe, probablemente podamos ayudarte.
              </p>
              <a
                href="#formulario"
                className="inline-flex items-center gap-2 gradient-cta text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-button hover:opacity-90 transition-opacity"
              >
                Consultar mi caso
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotForYouSection;
