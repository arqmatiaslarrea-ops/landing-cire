
import React from 'react';

const ProcessStep = ({ number, title, text }: { number: string, title: string, text: string }) => (
  <div className="relative pl-12">
    <div className="absolute left-0 top-0 w-8 h-8 bg-[#f35a3b] text-white flex items-center justify-center rounded-lg font-bold">
      {number}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-300">{text}</p>
  </div>
);

const Process: React.FC = () => {
  return (
    <section className="py-24 bg-[#3c4960] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Proceso simple, paso a paso.</h2>
            <p className="text-xl text-[#f79d3f] mb-12">Sin vueltas. Con filtros desde el inicio.</p>
            
            <div className="space-y-12">
              <ProcessStep 
                number="1"
                title="Completás el formulario"
                text="Te tomará solo 2 minutos. Buscamos entender el obstáculo real de tu caso."
              />
              <ProcessStep 
                number="2"
                title="Analizamos y respondemos"
                text="En menos de una semana sabrás si somos tus compradores o si no aplicamos. Análisis profesional sin costo."
              />
              <ProcessStep 
                number="3"
                title="Oferta concreta"
                text="Si aplica, te presentamos una oferta formal en 48 horas tras la visita técnica."
              />
              <ProcessStep 
                number="4"
                title="Cierre garantizado"
                text="Cierre estimado en 45 días o menos, encargándonos de toda la complejidad legal y técnica."
              />
            </div>
          </div>

          <div className="flex-1 w-full lg:max-w-md">
            <div className="bg-white/5 rounded-[2.5rem] p-10 text-white border border-white/10 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 bg-[#f79d3f] text-white p-4 rounded-2xl font-bold shadow-lg rotate-3">
                Cierre en 45 días
              </div>
              <h3 className="text-2xl font-bold mb-6 text-[#f79d3f]">Por qué nosotros</h3>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <span className="text-[#f35a3b] mr-3 mt-1 text-xl">✓</span>
                  <p><span className="font-bold text-white">Compradores directos</span>, no intermediarios ni inmobiliaria.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#f35a3b] mr-3 mt-1 text-xl">✓</span>
                  <p><span className="font-bold text-white">Análisis profesional</span> por equipo experto del rubro.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#f35a3b] mr-3 mt-1 text-xl">✓</span>
                  <p><span className="font-bold text-white">Estructuras flexibles</span> adaptadas a cada problema.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#f35a3b] mr-3 mt-1 text-xl">✓</span>
                  <p><span className="font-bold text-white">Velocidad garantizada</span> con proceso escrito desde el día 1.</p>
                </li>
              </ul>
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-slate-400 text-sm italic">"Compramos el problema completo: técnico, legal y emocional en menos de 45 días."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
