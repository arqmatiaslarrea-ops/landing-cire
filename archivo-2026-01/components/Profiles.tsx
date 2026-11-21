
import React from 'react';

const ProfileCard = ({ title, text, icon }: { title: string, text: string, icon: React.ReactNode }) => (
  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-sm hover:border-[#f79d3f]/30 transition-all">
    <div className="mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-300 leading-relaxed">{text}</p>
  </div>
);

const Profiles: React.FC = () => {
  return (
    <section className="py-24 bg-[#3c4960]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¿En cuál de estas situaciones estás?</h2>
          <p className="text-xl text-[#f79d3f]">Si te identificás, tiene sentido hablar.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProfileCard 
            title="Heredé y tengo una sucesión problemática"
            text="Trámites, deudas, conflictos familiares y desgaste emocional. Necesitás una salida clara y definitiva en tiempo récord."
            icon={<div className="w-12 h-12 bg-[#f79d3f]/20 rounded-xl flex items-center justify-center text-[#f79d3f]">🏛️</div>}
          />
          <ProfileCard 
            title="Mi propiedad esta en mal estado"
            text="Humedades, instalaciones cortadas o en desuso, gasto mensual constante. No podés refaccionar y necesitás vender tal cual está."
            icon={<div className="w-12 h-12 bg-[#f35a3b]/20 rounded-xl flex items-center justify-center text-[#f35a3b]">🏗️</div>}
          />
          <ProfileCard 
            title="Tengo un Problema legal con esta propiedad"
            text="Sucesión inconclusa, usufructo, ocupantes o juicios. Operaciones que se caen sistemáticamente por trabas legales."
            icon={<div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">⚖️</div>}
          />
          <ProfileCard 
            title="Es un mal negocio"
            text="Baja rentabilidad, cansancio de gestión o error en la compra. Querés recuperar liquidez rápido sin exposición."
            icon={<div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">📉</div>}
          />
        </div>

        <div className="mt-16 text-center">
          <a 
            href="#formulario" 
            className="bg-[#f35a3b] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#f35a3b]/90 transition-all inline-block shadow-lg active:scale-95"
          >
            Ver si mi caso califica
          </a>
        </div>
      </div>
    </section>
  );
};

export default Profiles;
