// Proceso: es una secuencia real, por eso va numerado.
const pasos = [
  {
    plazo: "2 minutos",
    titulo: "Completás el formulario",
    texto: "Datos básicos de la propiedad y de tu situación. Sin compromiso.",
  },
  {
    plazo: "30 minutos",
    titulo: "Llamada de descubrimiento",
    texto: "Te llamamos y te hacemos unas preguntas para entender tu caso: cómo está la propiedad, qué documentación tenés y cuáles son tus tiempos.",
  },
  {
    plazo: "48 horas",
    titulo: "Recibís una oferta concreta",
    texto: "Si el caso encaja, te mandamos una oferta por escrito con precio y condiciones. Si no podemos comprar, te lo decimos igual de rápido.",
  },
  {
    plazo: "90 días o menos*",
    titulo: "Cerramos",
    texto: "Nos ocupamos de la documentación y escrituramos. Vos no tenés que arreglar ni ordenar nada.",
  },
];

const ProcessSection = () => {
  return (
    <section className="bg-background-darker py-20 md:py-28">
      <div className="container">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="etiqueta text-primary">Cómo trabajamos</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">Cuatro pasos, plazos por escrito</h2>
        </div>

        <ol className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-border">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="border-b lg:border-b-0 lg:border-r last:border-r-0 border-border py-8 lg:px-6 lg:first:pl-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-5xl font-extrabold text-foreground/25 leading-none">{String(i + 1).padStart(2, "0")}</span>
                <span className="etiqueta text-primary text-right">{p.plazo}</span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold text-foreground">{p.titulo}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-muted-foreground">
          * Cierre garantizado en 90 días o menos desde que aceptás la oferta, con la documentación en regla.
        </p>
      </div>
    </section>
  );
};

export default ProcessSection;
