const razones = [
  {
    titulo: "Compramos de forma directa",
    texto: "Hablás con quien compra, sin intermediarios ni visitas de terceros.",
  },
  {
    titulo: "Miramos la propiedad como arquitectos",
    texto: "Antes de ofertar evaluamos el estado, la obra que necesita y la situación legal. Así la oferta es concreta, aunque la propiedad necesite trabajo.",
  },
  {
    titulo: "Te acompañamos en todo el proceso",
    texto: "Nos ocupamos de la parte técnica, legal y de gestión. No hace falta que arregles ni ordenes nada antes de vender.",
  },
];

const compromisos = ["Una respuesta clara: sí o no", "Oferta por escrito en 48 horas", "Cierre en 90 días o menos*"];

const DifferentialsSection = () => {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20">
        <div>
          <p className="etiqueta text-primary">Por qué nosotros</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">
            Una oferta con criterio técnico
          </h2>
          <ul className="mt-10 border-t border-border">
            {compromisos.map((c) => (
              <li key={c} className="flex items-baseline gap-4 border-b border-border py-4">
                <span className="etiqueta text-primary">Compromiso</span>
                <span className="font-semibold text-foreground">{c}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            * Desde que aceptás la oferta, con la documentación en regla.
          </p>
        </div>

        <div className="space-y-10">
          {razones.map((r) => (
            <div key={r.titulo} className="border-l-2 border-primary pl-6">
              <h3 className="text-2xl font-extrabold text-foreground">{r.titulo}</h3>
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{r.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DifferentialsSection;
