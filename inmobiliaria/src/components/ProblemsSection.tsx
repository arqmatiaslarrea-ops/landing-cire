// Fichas de relevamiento: cada situación contada como la releva un arquitecto en obra.
const fichas = [
  {
    situacion: "Herencia",
    titulo: "Heredaste y no sabés por dónde empezar",
    pasa: "Una sucesión que no avanza, herederos que no se ponen de acuerdo, trámites que se acumulan.",
    hacemos: "Compramos en el estado actual y nos ocupamos del problema completo, con respaldo legal.",
  },
  {
    situacion: "Obra",
    titulo: "La propiedad necesita mucha obra",
    pasa: "Humedades, instalaciones viejas, deterioro general. Te piden arreglar antes de vender o bajar el precio.",
    hacemos: "La compramos como está. Ofertamos con criterio de arquitecto: sabemos lo que cuesta la obra y no descontamos defecto por defecto.",
  },
  {
    situacion: "Deudas o embargos",
    titulo: "Hay deudas o un embargo",
    pasa: "Expensas, impuestos o servicios atrasados, o un embargo que traba la venta.",
    hacemos: "Analizamos el caso y armamos la operación para resolverlo. Compramos propiedades embargadas; no compramos propiedades ocupadas.",
  },
  {
    situacion: "Urgencia",
    titulo: "Tenés que vender en poco tiempo",
    pasa: "Necesitás el dinero o cerrar el tema ya, y una venta tradicional puede llevar meses sin fecha cierta.",
    hacemos: "Oferta por escrito y en dólares en 48 horas, con cierre en 90 días o menos desde que la aceptás.",
  },
];

const ProblemsSection = () => {
  return (
    <section className="seccion-clara py-20 md:py-28">
      <div className="container">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="etiqueta text-[#C73D08]">Relevamiento</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-[#1C1C1C] text-balance">Cada problema tiene una salida</h2>
          <p className="mt-5 text-lg text-[#444] leading-relaxed">
            Trabajamos como en una obra: primero entendemos la situación, después proponemos. Estos son los casos que más vemos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {fichas.map((f) => (
            <article key={f.situacion} className="rounded-2xl bg-white p-6 md:p-8">
              <p className="etiqueta text-[#C73D08]">Situación · {f.situacion}</p>
              <h3 className="mt-2 text-xl md:text-2xl font-extrabold text-[#1C1C1C] leading-tight">{f.titulo}</h3>
              <dl className="mt-6 space-y-4 border-t border-[#1C1C1C]/15 pt-5">
                <div className="grid sm:grid-cols-[8.5rem_1fr] gap-1 sm:gap-4">
                  <dt className="etiqueta text-[#666]">Lo que pasa</dt>
                  <dd className="text-[#333] leading-relaxed">{f.pasa}</dd>
                </div>
                <div className="grid sm:grid-cols-[8.5rem_1fr] gap-1 sm:gap-4">
                  <dt className="etiqueta text-[#666]">Lo que hacemos</dt>
                  <dd className="text-[#1C1C1C] font-medium leading-relaxed">{f.hacemos}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <a
          href="#formulario"
          className="recorte inline-block mt-10 bg-[#1C1C1C] text-[#EFEFEF] font-bold px-7 py-4 hover:bg-[#C73D08] transition-colors"
        >
          Contanos tu caso
        </a>
      </div>
    </section>
  );
};

export default ProblemsSection;
