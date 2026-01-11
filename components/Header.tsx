
import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#3c4960]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="#formulario" 
              className="bg-[#f35a3b] hover:bg-[#f35a3b]/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
            >
              Analizar mi caso
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
