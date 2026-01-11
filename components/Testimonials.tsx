
import React from 'react';

const VideoPlaceholder = ({ label }: { label: string }) => (
  <div className="relative aspect-video bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center group cursor-pointer overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    <div className="z-10 w-16 h-16 bg-[#f35a3b] rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-[#f35a3b]/20">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
    <div className="absolute bottom-4 left-6 text-left">
      <p className="text-white font-bold text-lg">{label}</p>
      <p className="text-slate-300 text-xs uppercase tracking-widest font-bold">Testimonio Real</p>
    </div>
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-[#3c4960] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Nuestro trabajo es real. <span className="text-[#f79d3f]">Cumplimos en plazo.</span>
        </h2>
        <p className="text-xl text-slate-300 mb-16 max-w-3xl mx-auto">
          Vendedores e inmobiliarias que confiaron en nuestro método de 45 días para dar una salida definitiva a propiedades con problemas.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <VideoPlaceholder label="Venta por Sucesión en Recoleta" />
          <VideoPlaceholder label="PH en Mal Estado - Caballito" />
          <VideoPlaceholder label="Problema Legal - Inmobiliaria X" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
