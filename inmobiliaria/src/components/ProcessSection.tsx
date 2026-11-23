// Proceso: es una secuencia real, por eso va numerado. La oferta se da después de la visita.
const pasos = [
  {
    plazo: "2 minutos",
    titulo: "Completás el formulario",
    texto: "Datos básicos de la propiedad y de tu situación. Sin compromiso.",
  },
  {
    plazo: "30 minutos",
    titulo: "Llamada de descubrimiento",
    texto: "Te hacemos unas preguntas para entender tu caso: cómo está la propiedad, qué documentación tenés y cuáles son tus tiempos.",
  },
  {
    plazo: "A coordinar",
    titulo: "Visitamos la propiedad",
    texto: "Si el caso encaja, coordinamos una visita para verla con criterio de arquitecto.",
  },
  {
    plazo: "48 horas",
    titulo: "Recibís la oferta",
    texto: "Si la propiedad cumple nuestro criterio de compra, te damos una oferta por escrito y en dólares dentro de las 48 horas posteriores a la visita.",
  },
  {
    plazo: "90 días o menos*",
    titulo: "Cerramos",
    texto: "Nuestro equipo se ocupa de la documentación y escrituramos. Vos no tenés que arreglar ni ordenar nada.",
  },
];

const ProcessSection = () => {
  return (
    <section
      className="trama bg-background-darker py-20 md:py-28"
      style={{
        "--trama-img": "url('/marca/bloque-naranja.svg')",
        "--trama-size": "70px 143px",
        "--trama-op": "0.05",
        "--trama-mask": "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
      } as React.CSSProperties}
    >
      <div className="container">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="etiqueta text-primary">Cómo trabajamos</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">Cinco pasos, plazos por escrito</h2>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12">
          {pasos.map((p, i) => (
            <li key={p.titulo}>
              <span className="numero-mono block text-5xl text-primary">{String(i + 1).padStart(2, "0")}</span>
              <span aria-hidden="true" className="block h-0.5 w-10 bg-primary my-5" />
              <p className="etiqueta text-muted-foreground">{p.plazo}</p>
              <h3 className="mt-2 text-xl font-extrabold text-foreground">{p.titulo}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 text-xs text-muted-foreground">
          * Cierre garantizado en 90 días o menos desde que aceptás la oferta, con la documentación en regla.
        </p>
      </div>
    </section>
  );
};

export default ProcessSection;
