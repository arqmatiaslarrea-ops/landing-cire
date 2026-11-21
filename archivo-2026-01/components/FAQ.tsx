
import React, { useState } from 'react';
import { ZONES } from '../constants';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-6 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none group"
      >
        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#f79d3f] transition-colors">{question}</h3>
        <span className={`transform transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-300 leading-relaxed text-lg">{answer}</p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section className="py-24 bg-[#3c4960]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Preguntas frecuentes</h2>
          <p className="text-xl text-[#f79d3f]">Respuestas honestas y directas.</p>
        </div>

        <div className="space-y-2">
          <FAQItem 
            question="¿Pagan precio de inmobiliaria retail?"
            answer="No. Compramos con criterio profesional y análisis de riesgo real. Resolvemos problemas complejos en 45 días, algo que una inmobiliaria no puede garantizar."
          />
          <FAQItem 
            question="¿Compran propiedades 'perfectas'?"
            answer="No es nuestro foco. Nos especializamos en propiedades con problemas técnicos, legales o financieros. Si tu casa no tiene trabas, te conviene una inmobiliaria tradicional."
          />
          <FAQItem 
            question="¿Compran en cualquier zona?"
            answer={`No. Actualmente operamos exclusivamente en Capital Federal (CABA). Zonas preferenciales: ${ZONES}.`}
          />
          <FAQItem 
            question="¿Compran embargos?"
            answer="No compramos propiedades con embargos vigentes. Analizamos sucesiones, deudas, ocupantes y mal estado general."
          />
          <FAQItem 
            question="¿Qué pasa si mi caso es muy complejo?"
            answer="Ahí es donde actuamos. Sometemos el caso a nuestro equipo de profesionales y en menos de una semana te decimos si podemos comprar y bajo qué estructura."
          />
        </div>

        <div className="mt-16 text-center">
          <p className="text-white font-bold mb-6">¿Todavía tenés dudas?</p>
          <a href="#formulario" className="inline-block bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all">
            Si te identificás, completá el formulario
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
