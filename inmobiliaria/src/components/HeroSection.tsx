import { useState } from "react";
import LeadForm from "./LeadForm";

// Situaciones: los valores coinciden con el primer paso del formulario (problemType)
const situaciones = [
  { valor: "herencia", texto: "Heredé una propiedad" },
  { valor: "deterioro", texto: "Necesita mucha obra" },
  { valor: "legal", texto: "Tiene deudas o embargos" },
  { valor: "urgencia", texto: "Necesito vender rápido" },
  { valor: "otro", texto: "Otra situación" },
];

const ficha = [
  { campo: "Oferta", valor: "48 hs tras la visita" },
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
    <section
      className="trama bg-background min-h-screen py-8 md:py-12"
      style={{
        "--trama-img": "url('/marca/doble-c-blanco.svg')",
        "--trama-size": "150px",
        "--trama-op": "0.05",
        "--trama-mask": "radial-gradient(ellipse 70% 80% at 100% 0%, #000 20%, transparent 75%)",
      } as React.CSSProperties}
    >
      <div className="container">
        <header className="flex items-center justify-between gap-4 pb-10 md:pb-16">
          <img src="/cire-logo.png" alt="CIRE" className="h-16 w-16 md:h-20 md:w-20" />
          <a href="#formulario" className="etiqueta text-foreground hover:text-primary transition-colors">
            Pedir mi oferta
          </a>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
          <div className="space-y-9">
            <div className="flex items-center gap-3">
              <img src="/marca/isotipo-naranja.svg" alt="" aria-hidden="true" className="h-9 w-auto lg:hidden" />
              <p className="etiqueta text-primary">Compra directa · Arq. Matías Larrea</p>
            </div>

            <h1 className="text-foreground">
              <span className="block text-[2.6rem] sm:text-6xl lg:text-7xl">Vendé tu propiedad</span>
              <span className="block mt-4 text-[1.45rem] sm:text-3xl lg:text-[2.3rem] text-primary leading-tight">
                <span className="inline-block">Rápido.</span> <span className="inline-block">Sin comisiones.</span> <span className="inline-block">Sin vueltas.</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/85 max-w-xl leading-relaxed">
              Herencia, deudas, embargos, mucha obra o urgencia: compramos departamentos, PH y casas en CABA, como están. Si la propiedad cumple nuestro criterio de compra, te damos una oferta por escrito y en dólares 48 horas después de visitarla.
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

          <div id="formulario" className="relative lg:sticky lg:top-6 w-full max-w-[34rem] mx-auto lg:mx-0 scroll-mt-6">
            {/* Isotipo (la llave de CIRE) anclado al panel, como en el kit de sitio de la marca */}
            <img
              src="/marca/isotipo-naranja.svg"
              alt=""
              aria-hidden="true"
              className="hidden lg:block absolute -left-7 -bottom-9 w-11 z-10"
            />
            <div className="recorte bg-background-dark p-5 md:p-7">
              <p className="etiqueta text-primary">Pedí tu oferta</p>
              <p className="mt-1 mb-5 text-sm text-muted-foreground">
                Tres pasos, dos minutos. Te contactamos para entender tu caso.
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
