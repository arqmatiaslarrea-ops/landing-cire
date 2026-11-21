
import React, { useState } from 'react';
import { ProblemType, UrgencyType, ExpectationType, FormData } from '../types';

const QualifyForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    problem: '',
    urgency: '',
    expectation: '',
    neighborhood: '',
    whatsapp: '',
    email: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="formulario" className="py-24 bg-[#3c4960] flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-[#f79d3f]/20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Evaluación iniciada</h2>
          <p className="text-xl text-slate-600">
            Nuestro equipo de profesionales analizará tu caso y en menos de una semana te contactaremos para confirmarte si somos tus compradores.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="formulario" className="py-24 bg-[#3c4960] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Analizamos tu caso y en menos de una semana sabremos si somos tus compradores.</h2>
          <p className="text-xl text-[#f79d3f] font-bold">Formulario corto e incomodo para filtrar curiosos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white text-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6 md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                1. ¿Cuál es el problema principal?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(ProblemType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, problem: type})}
                    className={`text-left px-5 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                      formData.problem === type 
                        ? 'border-[#f35a3b] bg-[#f35a3b]/5 text-[#f35a3b]' 
                        : 'border-slate-100 hover:border-[#f79d3f]/30 text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                2. Plazo de venta deseado
              </label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-[#f35a3b] outline-none transition-all font-bold"
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value as UrgencyType})}
              >
                <option value="" disabled>Seleccionar plazo</option>
                {Object.values(UrgencyType).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                3. Expectativa real
              </label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-[#f35a3b] outline-none transition-all font-bold"
                value={formData.expectation}
                onChange={(e) => setFormData({...formData, expectation: e.target.value as ExpectationType})}
              >
                <option value="" disabled>Seleccionar expectativa</option>
                {Object.values(ExpectationType).map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                4. Barrio / Zona (CABA)
              </label>
              <input 
                type="text"
                required
                placeholder="Ej: Caballito, Palermo..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-[#f35a3b] outline-none transition-all font-bold placeholder:text-slate-300"
                value={formData.neighborhood}
                onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                5. WhatsApp
              </label>
              <input 
                type="tel"
                required
                placeholder="+54 9 11 ..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-[#f35a3b] outline-none transition-all font-bold placeholder:text-slate-300"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500">
                6. Email
              </label>
              <input 
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-[#f35a3b] outline-none transition-all font-bold placeholder:text-slate-300"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

          </div>

          <div className="mt-12 text-center">
            <button 
              type="submit"
              className="w-full bg-[#f35a3b] hover:bg-[#f35a3b]/90 text-white font-black text-2xl py-6 rounded-2xl shadow-xl shadow-[#f35a3b]/30 transition-all active:scale-[0.98]"
            >
              ENVIAR Y PEDIR EVALUACIÓN
            </button>
            <p className="mt-6 text-slate-400 text-sm font-bold">
              Cupo actual: <span className="text-[#3c4960] font-black underline">1 compra por mes.</span> Venta garantizada en menos de 45 días si califica.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default QualifyForm;
