
import React from 'react';
import { CheckIcon } from '../constants';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-[#3c4960] pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f79d3f] via-transparent to-transparent"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest mb-10">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>Operando en Capital Federal</span>
        </div>
        
        {/* H1 Redesign */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
            <span className="block mb-2">SI QUERÉS</span>
            <span className="text-[#f79d3f] inline-block relative">
              VENDER TU PROPIEDAD
              <span className="absolute -bottom-2 left-0 w-full h-2 bg-[#f79d3f]/20 rounded-full"></span>
            </span>
            <br />
            <span className="block mt-4 text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-200">
              EN LOS PRÓXIMOS <span className="bg-white text-[#3c4960] px-4 py-1 rounded-2xl transform -rotate-2 inline-block shadow-xl">45 DÍAS</span>
            </span>
            <br />
            <span className="block mt-6 text-[#f35a3b]">NOSOTROS SOMOS TUS COMPRADORES.</span>
          </h1>
        </div>
        
        <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-300 font-medium leading-relaxed mb-8">
          Compramos propiedades con problemas reales. Oferta en 48 horas. <br className="hidden md:block" />
          <span className="text-white font-bold underline decoration-[#f79d3f] decoration-4 underline-offset-8">Cierre estimado en 45 días o menos.</span> Sin vueltas.
        </p>

        <p className="max-w-3xl mx-auto text-md text-[#f79d3f] font-bold mb-16 leading-relaxed italic opacity-90">
          "Sometemos cada caso a análisis de un equipo de profesionales para entregar una respuesta rápida y acertada. Sin cargo."
        </p>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {[
            { title: "Venta en 45 días\no menos", color: "#f35a3b" },
            { title: "Sin comisión\ninmobiliaria", color: "#f79d3f" },
            { title: "Compramos\ntal cual está", color: "#f35a3b" }
          ].map((benefit, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center group hover:bg-white/10 transition-all duration-500">
              <div className="p-4 rounded-2xl mb-6 shadow-inner" style={{ backgroundColor: `${benefit.color}20` }}>
                <CheckIcon className="w-8 h-8" style={{ color: benefit.color }} />
              </div>
              <span className="text-2xl font-black text-white text-center leading-tight whitespace-pre-line">
                {benefit.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <a 
            href="#formulario" 
            className="group relative inline-flex items-center justify-center bg-[#f35a3b] hover:bg-[#f35a3b]/90 text-white text-xl font-black px-14 py-7 rounded-2xl transition-all shadow-[0_20px_50px_rgba(243,90,59,0.3)] active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              ANALIZAR MI CASO AHORA
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-4 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>
          <p className="mt-6 text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-8 h-px bg-slate-700"></span>
            Evaluación profesional sin costo
            <span className="w-8 h-px bg-slate-700"></span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
