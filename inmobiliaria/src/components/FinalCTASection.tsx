// Cierre en naranja pleno con foto en duotono y textura de hormigón negra:
// el Design System lo reserva para los momentos de entrega.
const FinalCTASection = () => {
  return (
    <section className="relative isolate overflow-hidden bg-[#FF551A] py-20 md:py-28">
      <img
        src="/marca/papeles.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-y-0 right-0 -z-10 h-full w-full md:w-[55%] object-cover object-[50%_75%] mix-blend-multiply opacity-25 md:opacity-70"
        style={{ WebkitMaskImage: "linear-gradient(to right, transparent, #000 45%)", maskImage: "linear-gradient(to right, transparent, #000 45%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-10 bg-[url('/marca/textura-hormigon-negra.svg')] bg-[length:900px]"
      />
      <div className="container">
        <div className="max-w-2xl">
          <p className="etiqueta text-[#1C1C1C]/75">Solo CABA · Oferta por escrito y en dólares</p>
          <h2 className="mt-4 text-4xl md:text-6xl text-[#1C1C1C] text-balance">
            Contanos tu caso. Te decimos si podemos comprar.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-[#1C1C1C] leading-relaxed">
            Si la propiedad cumple nuestro criterio de compra, la visitamos y te damos la oferta en 48 horas. Si no, te lo decimos rápido y claro.
          </p>
          <a
            href="#formulario"
            className="recorte inline-block mt-10 bg-[#1C1C1C] text-[#EFEFEF] text-lg font-bold px-9 py-5 hover:bg-[#282828] transition-colors"
          >
            Pedir mi oferta
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
