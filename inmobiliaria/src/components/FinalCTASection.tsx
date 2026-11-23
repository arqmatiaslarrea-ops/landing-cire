const FinalCTASection = () => {
  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container">
        <div className="rounded-[2rem] bg-[#1C1C1C] px-6 py-14 md:px-14 md:py-20">
          <div className="max-w-3xl">
            <p className="etiqueta text-[#FF551A]">Oferta en 48 horas · Solo CABA</p>
            <h2 className="mt-3 text-4xl md:text-6xl text-[#EFEFEF] text-balance">
              Contanos tu caso. En 48 horas tenés una respuesta.
            </h2>
            <p className="mt-6 text-lg md:text-xl text-[#BDBDBD] leading-relaxed">
              Si podemos comprar, te mandamos una oferta por escrito y en dólares. Si no, te lo decimos rápido y claro.
            </p>
            <a
              href="#formulario"
              className="recorte inline-block mt-10 bg-primary text-primary-foreground text-lg font-bold px-9 py-4 hover:bg-[#C73D08] transition-colors"
            >
              Pedir mi oferta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
