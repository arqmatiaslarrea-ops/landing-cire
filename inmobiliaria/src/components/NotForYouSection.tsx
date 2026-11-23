const noEsParaVos = [
  "Buscás el precio máximo de mercado sin importar el tiempo",
  "Podés esperar meses o años para vender",
  "Querés probar suerte a ver si alguien paga de más",
  "La propiedad está fuera de CABA",
  "Tiene un embargo judicial activo",
];

const NotForYouSection = () => {
  return (
    <section className="seccion-clara py-20 md:py-28">
      <div className="container grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-20 items-start">
        <div>
          <p className="etiqueta text-[#C73D08]">Antes de seguir</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-[#1C1C1C] text-balance">Esto no es para vos si…</h2>
          <p className="mt-5 text-lg text-[#444] leading-relaxed">
            Preferimos decírtelo ahora antes que hacerte perder el tiempo. Compramos con descuento porque asumimos el riesgo y la gestión: no somos la opción para todos.
          </p>
        </div>

        <ul className="border-t border-[#1C1C1C]/15">
          {noEsParaVos.map((item) => (
            <li key={item} className="flex gap-4 border-b border-[#1C1C1C]/15 py-4 text-lg text-[#1C1C1C]">
              <span aria-hidden="true" className="etiqueta text-[#C73D08] pt-1.5">No</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default NotForYouSection;
