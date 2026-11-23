const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-10">
      <div className="container flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src="/cire-logo.png" alt="CIRE" className="h-10 w-10" />
          <p className="text-sm text-muted-foreground">Compramos propiedades con problemas en CABA.</p>
        </div>
        <div className="flex items-center gap-6">
          <a href="/politica-de-privacidad" className="etiqueta text-muted-foreground hover:text-primary transition-colors">
            Política de privacidad
          </a>
          <span className="etiqueta text-muted-foreground">© {new Date().getFullYear()} CIRE</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
