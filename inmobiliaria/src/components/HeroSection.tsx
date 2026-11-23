import { useState } from "react";
import LeadForm from "./LeadForm";

// Situaciones: los valores coinciden con el primer paso del formulario (problemType)
const situaciones = [
  { valor: "herencia", texto: "Heredé una propiedad" },
  { valor: "deterioro", texto: "Necesita mucha obra" },
  { valor: "legal", texto: "Tiene deudas u ocupantes" },
  { valor: "inversion", texto: "Una inversión que no funcionó" },
  { valor: "otro", texto: "Otra situación" },
];

const ficha = [
  { campo: "Oferta", valor: "En 48 hs" },
  { campo: "Cierre", valor: "90 días o menos*" },
  { campo: "Estado", valor: "Como está" },
  { campo: "Zona", valor: "Solo CABA" },
];

const HeroSection = () => {
  const [situacion, setSituacion] = useState("");

  const elegir = (valor: string) => {
    setSituacion(valor);
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="textura bg-background min-h-screen py-8 md:py-12">
      <div className="container">
        <header className="flex items-center justify-between gap-4 pb-10 md:pb-16">
          <img src="/cire-logo.png" alt="CIRE" className="h-11 w-11 md:h-12 md:w-12" />
          <a href="#formulario" className="etiqueta text-foreground hover:text-primary transition-colors">
            Pedir mi oferta
          </a>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
          <div className="space-y-9">
            <p className="etiqueta text-primary">Compra directa · Arq. Matías Larrea</p>

            <h1 className="text-[2.6rem] sm:text-6xl lg:text-7xl text-foreground text-balance">
              Tu propiedad tiene un problema. Nosotros la compramos.
            </h1>

            <p className="text-lg md:text-xl text-foreground/85 max-w-xl leading-relaxed">
              Herencias, deudas, ocupantes u obra pendiente. Compramos en CABA en el estado en que está, con una oferta concreta en 48 horas.
            </p>

            <div className="space-y-3">
              <p className="etiqueta text-muted-foreground">¿Cuál es tu situación?</p>
              <div className="flex flex-wrap gap-2">
                {situaciones.map((s) => (
                  <button
                    key={s.valor}
                    type="button"
                    onClick={() => elegir(s.valor)}
                    aria-pressed={situacion === s.valor}
                    className={`border px-4 py-2.5 text-[0.95rem] transition-colors ${
                      situacion === s.valor
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {s.texto}
                  </button>
                ))}
              </div>
            </div>

            {/* Ficha técnica: el elemento de marca de la landing */}
            <div className="border border-border max-w-xl">
              <dl className="grid grid-cols-2 sm:grid-cols-4">
                {ficha.map((f, i) => (
                  <div
                    key={f.campo}
                    className={`p-4 ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i > 0 ? "sm:border-l" : ""} border-border`}
                  >
                    <dt className="etiqueta text-muted-foreground">{f.campo}</dt>
                    <dd className="mt-1 font-bold text-foreground">{f.valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              * Cierre garantizado en 90 días o menos desde que aceptás la oferta, con la documentación en regla.
            </p>
          </div>

          <div id="formulario" className="lg:sticky lg:top-6 w-full max-w-[34rem] mx-auto lg:mx-0 scroll-mt-6">
            <div className="recorte bg-background-dark p-5 md:p-7">
              <p className="etiqueta text-primary">Pedí tu oferta</p>
              <p className="mt-1 mb-5 text-sm text-muted-foreground">
                Tres pasos, dos minutos. Te respondemos en 48 horas.
              </p>
              <LeadForm situacion={situacion} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
