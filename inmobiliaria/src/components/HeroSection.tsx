import LeadForm from "./LeadForm";
import { Shield, Clock, FileCheck } from "lucide-react";
const HeroSection = () => {
  return <section className="min-h-screen gradient-background py-12 md:py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Content */}
          <div className="space-y-8 pt-4 md:pt-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Compramos 1 propiedad por mes
              </span>
            </div>

            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight text-balance">
                ¿Tu propiedad tiene un{" "}
                <span className="gradient-text">problema real</span>?
              </h1>
              <p className="text-xl md:text-2xl text-foreground/90 font-medium">
                Probablemente nosotros seamos los compradores.
              </p>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-xl">
              No somos inmobiliaria. Somos compradores directos que adquirimos 
              propiedades con problemas legales, técnicos o de gestión que otros 
              no quieren tocar.
            </p>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Oferta en 48hs</p>
                  <p className="text-xs text-muted-foreground">Cierre en 45 días</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Sin comisión</p>
                  <p className="text-xs text-muted-foreground">Compra directa</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Como está</p>
                  <p className="text-xs text-muted-foreground">Sin reparaciones</p>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="pt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">CIRE</span> — Círculo de Innovación en Real Estate. Compramos propiedades con problemas en Capital Federal, Buenos Aires.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:sticky lg:top-8 w-full max-w-[34rem] mx-auto lg:mx-0">
            <div className="mb-4 text-center lg:text-left">
              <p className="text-sm text-muted-foreground">
                Analizamos tu caso en menos de una semana
              </p>
            </div>
            <LeadForm />
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;