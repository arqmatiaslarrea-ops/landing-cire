const Footer = () => {
  return (
    <footer className="bg-background-darker border-t border-border py-12">
      <div className="container flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-center gap-5">
          <img src="/cire-logo.png" alt="CIRE" className="h-14 w-14" />
          <div>
            <p className="etiqueta text-foreground">CIRE · Círculo de Innovación en Real Estate</p>
            <p className="mt-1 text-sm text-muted-foreground">Compramos propiedades con problemas en CABA.</p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4">
          <img src="/marca/firma.png" alt="" aria-hidden="true" className="h-8 w-auto invert opacity-60" />
          <div className="flex items-center gap-6">
            <a href="/politica-de-privacidad" className="etiqueta text-muted-foreground hover:text-primary transition-colors">
              Política de privacidad
            </a>
            <span className="etiqueta text-muted-foreground">© {new Date().getFullYear()} CIRE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
