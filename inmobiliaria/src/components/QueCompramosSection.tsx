// Ficha de compra: lo que compra CIRE, según el Cerebro (unidades de wholesaling y desarrolladora).
const ficha = [
  { campo: "Tipo", valor: "Departamentos, PH y casas" },
  {
    campo: "Zona",
    valor: "Solo CABA. Sobre todo Saavedra, Villa Urquiza, Villa Pueyrredón, Coghlan, Devoto, Villa del Parque, Caballito, Boedo y Villa Crespo.",
  },
  { campo: "Situación", valor: "Herencia o sucesión, deudas, embargos, mucha obra o urgencia de venta. No compramos propiedades ocupadas" },
  { campo: "Estado", valor: "Como está. No hace falta arreglar nada" },
  { campo: "Oferta", valor: "Por escrito y en dólares, en 48 horas" },
  { campo: "Cierre", valor: "90 días o menos desde que aceptás la oferta*" },
];

const QueCompramosSection = () => {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-20 items-start">
        <div>
          <p className="etiqueta text-primary">Qué compramos</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">Lo que buscamos, en una ficha</h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Si tu propiedad encaja en esta ficha, es muy probable que podamos hacerte una oferta.
          </p>
        </div>

        <dl className="border-t border-border">
          {ficha.map((f) => (
            <div key={f.campo} className="grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-6 border-b border-border py-5">
              <dt className="etiqueta text-primary pt-1">{f.campo}</dt>
              <dd className="text-lg text-foreground leading-relaxed">{f.valor}</dd>
            </div>
          ))}
          <p className="pt-4 text-xs text-muted-foreground">* Con la documentación en regla.</p>
        </dl>
      </div>
    </section>
  );
};

export default QueCompramosSection;
