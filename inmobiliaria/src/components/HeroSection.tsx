import LeadForm from "./LeadForm";

const datos = [
  { titulo: "Respuesta en 48 hs", detalle: "Te decimos si podemos comprar, sin vueltas." },
  { titulo: "Compra directa, sin comisión", detalle: "Hablás con quien compra, no con un intermediario." },
  { titulo: "Se compra como está", detalle: "No tenés que reparar ni ordenar nada antes." },
];

const HeroSection = () => {
  return (
    <section className="min-h-screen gradient-background py-12 md:py-20">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Izquierda: propuesta de valor */}
          <div className="space-y-8 pt-4 md:pt-8">
            <div className="flex items-center gap-3">
              <img src="/cire-logo.png" alt="CIRE" className="h-12 w-12" />
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Compra directa en CABA y GBA</p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.05] text-balance">
                ¿Tu propiedad tiene un problema legal, técnico o de gestión?
              </h1>
              <p className="text-lg md:text-xl text-foreground/90">
                Probablemente nosotros podamos comprarla. Somos compradores directos: no somos inmobiliaria.
              </p>
            </div>

            <a
              href="#formulario"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-button hover:opacity-90 transition-opacity"
            >
              Quiero que analicen mi caso
            </a>

            {/* Datos: lista tipográfica, sin tarjetas */}
            <ul className="divide-y divide-border/40 border-y border-border/40">
              {datos.map((d) => (
                <li key={d.titulo} className="py-4">
                  <p className="font-semibold text-foreground">{d.titulo}</p>
                  <p className="text-sm text-muted-foreground">{d.detalle}</p>
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground">
              CIRE compra propiedades con problemas en Capital Federal y Buenos Aires.
            </p>
          </div>

          {/* Derecha: formulario */}
          <div id="formulario" className="lg:sticky lg:top-8 w-full max-w-[34rem] mx-auto lg:mx-0 scroll-mt-8">
            <p className="mb-4 text-center lg:text-left text-sm text-muted-foreground">
              Completá los datos y te respondemos en 48 hs.
            </p>
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
