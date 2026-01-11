
import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Filters from './components/Filters';
import Profiles from './components/Profiles';
import QualifyForm from './components/QualifyForm';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#3c4960]">
      <Header />
      <main>
        <Hero />
        
        {/* Social Proof Placeholder / Credibility Bar */}
        <section className="bg-white/5 py-10 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
              <span className="text-lg font-bold text-[#f79d3f]">OFERTA EN 48HS</span>
              <span className="text-lg font-bold text-[#f79d3f]">COMPRADORES DIRECTOS</span>
              <span className="text-lg font-bold text-[#f79d3f]">PROCESO TRANSPARENTE</span>
              <span className="text-lg font-bold text-[#f79d3f]">RESPALDO PROFESIONAL</span>
            </div>
          </div>
        </section>

        <Filters />
        
        <Testimonials />

        <Profiles />
        
        {/* Promise Section */}
        <section className="py-24 bg-[#3c4960] border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Una salida realista: compra directa cuando califica.</h2>
            <p className="text-xl text-[#f79d3f] mb-12">Cerramos tu venta en 45 días o menos.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-[#f79d3f] mb-1">48 hs</p>
                <p className="text-xs font-bold uppercase text-slate-400">Respuesta</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-[#f35a3b] mb-1">45 días</p>
                <p className="text-xs font-bold uppercase text-slate-400">Cierre Máx</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-white mb-1">0%</p>
                <p className="text-xs font-bold uppercase text-slate-400">Comisión</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-green-400 mb-1">100%</p>
                <p className="text-xs font-bold uppercase text-slate-400">Certeza</p>
              </div>
            </div>
          </div>
        </section>

        <QualifyForm />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default App;
