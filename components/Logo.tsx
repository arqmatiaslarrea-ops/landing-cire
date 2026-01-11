
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-3xl font-[900] tracking-tighter text-white uppercase leading-none">
        CIRE
      </span>
    </div>
  );
};

export default Logo;
