
import React from 'react';
import { CONTACT_INFO } from '../constants';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#3c4960] border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Si necesitás vender en 45 días y tu propiedad tiene un problema, este es el siguiente paso.
          </h2>
          <p className="text-xl text-[#f79d3f] mb-12 max-w-2xl mx-auto font-bold">
            Conversaciones reales, soluciones rápidas. Si buscás una salida concreta, evaluamos tu caso sin cargo.
          </p>
          <a 
            href="#formulario" 
            className="bg-[#f35a3b] hover:bg-[#f35a3b]/90 text-white font-black px-12 py-6 rounded-2xl shadow-2xl transition-all active:scale-95 text-lg"
          >
            Analizar mi caso ahora
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-12 py-12 border-t border-white/10">
          <div>
            <Logo className="mb-4" />
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Compradores directos de propiedades con problemas en CABA. Analizamos rápido, decidimos claro. <span className="text-white font-bold">Venta en 45 días o menos.</span>
            </p>
          </div>
          <div>
            <h4 className="font-black text-white text-lg mb-6 uppercase tracking-wider">Contacto Directo</h4>
            <ul className="space-y-4 text-slate-300 text-md font-bold">
              <li className="flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-lg">📱</span>
                <a href={CONTACT_INFO.whatsapp} className="hover:text-[#f79d3f] transition-colors">{CONTACT_INFO.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-lg">✉️</span>
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-[#f79d3f] transition-colors">{CONTACT_INFO.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-lg">📍</span>
                <span>Capital Federal, Argentina</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-white text-lg mb-6 uppercase tracking-wider">Información</h4>
            <ul className="space-y-3 text-slate-500 text-sm font-bold">
              <li><a href="#" className="hover:text-slate-300 transition-colors underline underline-offset-4">Aviso Legal</a></li>
              <li><a href="#" className="hover:text-slate-300 transition-colors underline underline-offset-4">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-slate-300 transition-colors underline underline-offset-4">Términos y Condiciones</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs font-bold gap-4 uppercase tracking-tighter">
          <p>© {new Date().getFullYear()} CIRE Inversiones. Arq. Matías Larrea.</p>
          <p>Operamos solo en CABA. Cupo limitado a 1 compra mensual.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
