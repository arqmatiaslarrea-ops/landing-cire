
import React from 'react';

export const COLORS = {
  background: '#3c4960', // Dark blue-grey
  principal: '#f79d3f',  // Orange
  accent: '#f35a3b',     // Coral/Reddish-orange
  white: '#ffffff'
};

export const ZONES = "Palermo, Belgrano, Recoleta, Almagro, Caballito, Villa Urquiza (Consultar otros barrios de CABA)";

export const CONTACT_INFO = {
  phone: "+54 9 11 5495-0446",
  whatsapp: "https://wa.me/5491154950446",
  email: "arqmatiaslarrea@gmail.com"
};

// Added style prop to allow dynamic color and other CSS properties from parent components
export const CheckIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

// Added style prop to ensure consistency across standard icon components
export const XIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// Added style prop to ensure consistency across standard icon components
export const ClockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
