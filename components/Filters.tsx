
import React from 'react';
import { CheckIcon, XIcon } from '../constants';

const Filters: React.FC = () => {
  return (
    <section className="py-24 bg-[#3c4960] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Antes de avanzar, esta pagina es para vendedores decididos, listos para tomar accion.
          </h2>
          <p className="text-xl text-[#f79d3f] font-medium">Si querés "probar precio", esta no es tu web.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* SI */}
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="p-2 bg-green-500/20 rounded-lg mr-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
              </span>
              Si trabajamos con:
            </h3>
            <ul className="space-y-6 text-slate-200">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                <span>Propiedades con problemas constructivos, de mantenimiento, legales o financieros.</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                <span>Dueños que precisan vender en 45-60 dias. Priorizan la certeza y la velocidad.</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                <span>Casos con problemas reales que dificultan o impiden la venta tradicional.</span>
              </li>
            </ul>
          </div>

          {/* NO */}
          <div className="bg-red-500/5 rounded-3xl p-8 border border-red-500/10 shadow-sm">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="p-2 bg-red-500/20 rounded-lg mr-3">
                <XIcon className="w-6 h-6 text-red-400" />
              </span>
              No trabajamos con:
            </h3>
            <ul className="space-y-4 text-slate-200">
              <li className="flex items-start">
                <XIcon className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <span>Estás solo explorando y no tenés decisión de venta en el corto plazo.</span>
              </li>
              <li className="flex items-start">
                <XIcon className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <span>Buscás precio retail o querés esperar al comprador ideal.</span>
              </li>
              <li className="flex items-start">
                <XIcon className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <span>Tu propiedad está en estado ideal y sin complicaciones.</span>
              </li>
              <li className="flex items-start">
                <XIcon className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <span>Querés comparar muchas ofertas sin intención de avanzar.</span>
              </li>
              <li className="flex items-start">
                <XIcon className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <span>Está fuera de Capital Federal o fuera de las zonas que trabajamos.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Nuestra propuesta prioriza certeza y velocidad. No pagamos precios retail ni trabajamos con propiedades ideales.
          </p>
          <a href="#formulario" className="inline-block font-bold text-[#f79d3f] hover:text-[#f35a3b] underline underline-offset-4 transition-colors">
            Si encajás, completá el formulario →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Filters;
