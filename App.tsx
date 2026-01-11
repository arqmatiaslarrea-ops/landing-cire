import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Filters from './components/Filters';
import Profiles from './components/Profiles';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';

// HubSpot Form Embed (reemplaza QualifyForm)
const HubspotQualifyForm: React.FC = () => {
  useEffect(() => {
    // Evita insertar el script más de una vez
    const existing = document.querySelector(
      'script[src="https://js.hsforms.net/forms/embed/50584189.js"]'
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://js.hsforms.net/forms/embed/50584189.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <section id="analizar" className="py-20 bg-white/5 border-y border-white/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-4">
          Analizá tu caso
        </h2>
        <p className="text-base md:text-lg text-slate-200 text-center mb-10">
          Completá estos datos y te respondemos en 48 hs.
        </p>

        <div className="bg-white rounded-2xl p-6 md:p-10">
          <div
            className="hs-form-frame"
            data-region="na1"
            data-form-id="2631661a-fe4d-494c-8bbf-a9728ef2b92f"
            data-portal-id="50584189"
          />
        </div>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  // 1) Scroll suave global (no requiere tocar CSS)
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // 2) “Capturo” clicks de CTAs y bajo al formulario
  useEffect(() => {
    const scrollToForm = () => {
      const el = document.getElementById('analizar');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const matchesCtaText = (text: string) => {
      const t = (text || '').toLowerCase().trim();

      // Palabras clave típicas de tus CTAs
      // (podés sumar o sacar palabras si querés)
      const keywords = [
        'analiz',     // analizar, analizá
        'calific',    // calificar, califico
        'oferta',     // oferta
        'evalu',      // evaluar, evaluación
        'contact',    // contacto
        'quiero',     // quiero
        'hablar',     // hablar
        'llamad',     // llamada, llamame
        'agendar',    // agendar
        'cotizar',    // cotizar
      ];

      return keywords.some((k) => t.includes(k));
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Busco si el click fue dentro de un <a> o <button>
      const clickable = target.closest('a,button') as HTMLElement | null;
      if (!clickable) return;

      // Si es un link explícito a #analizar, lo manejo y listo
      if (clickable.tagName.toLowerCase() === 'a') {
        const href = (clickable as HTMLAnchorElement).getAttribute('href') || '';
        if (href === '#analizar' || href.endsWith('#analizar')) {
          e.preventDefault();
          scrollToForm();
          return;
        }
      }

      // Si es un botón/CTA cuyo texto coincide, también bajo al formulario
      const text = clickable.textContent || '';
      if (matchesCtaText(text)) {
        e.preventDefault();
        scrollToForm();
      }
    };

    // Captura en fase "capture" para agarrar clicks incluso si hay handlers internos
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

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
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Una salida realista: compra directa cuando califica.
            </h2>
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

        {/* HubSpot Form */}
        <HubspotQualifyForm />

        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default App;
