// Comparación honesta: la venta tradicional gana en precio; CIRE, en tiempo y certeza.
const filas = [
  { tema: "Precio", cire: "Con descuento, por escrito y en dólares", tradicional: "Precio de mercado, cuando aparece el comprador" },
  { tema: "Plazo", cire: "Oferta en 48 horas y cierre en 90 días o menos*", tradicional: "Variable: puede llevar varios meses" },
  { tema: "Estado", cire: "Como está, sin arreglos", tradicional: "Suelen pedir arreglos o un ajuste de precio" },
  { tema: "Comisión", cire: "No hay", tradicional: "Sí, la habitual del corretaje" },
];

const ComparativaSection = () => {
  return (
    <section className="seccion-clara py-20 md:py-28">
      <div className="container">
        <div className="max-w-3xl mb-10 md:mb-14">
          <p className="etiqueta text-[#C73D08]">Antes de decidir</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-[#1C1C1C] text-balance">Dos formas de vender</h2>
          <p className="mt-5 text-lg text-[#444] leading-relaxed">
            Las dos son válidas. La diferencia está en qué necesitás más: el mejor precio posible, o tiempo y certeza.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-[#1C1C1C]">
                <th scope="col" className="w-[22%] py-4 pr-4"><span className="sr-only">Tema</span></th>
                <th scope="col" className="py-4 pr-4 text-lg font-extrabold text-[#1C1C1C]">Vender a CIRE</th>
                <th scope="col" className="py-4 text-lg font-extrabold text-[#555]">Venta tradicional</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.tema} className="border-b border-[#1C1C1C]/15 align-top">
                  <th scope="row" className="py-5 pr-4 etiqueta font-normal text-[#666]">{f.tema}</th>
                  <td className="py-5 pr-4 text-[#1C1C1C] font-medium leading-relaxed">{f.cire}</td>
                  <td className="py-5 text-[#555] leading-relaxed">{f.tradicional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-[#555]">* Desde que aceptás la oferta, con la documentación en regla.</p>
      </div>
    </section>
  );
};

export default ComparativaSection;
