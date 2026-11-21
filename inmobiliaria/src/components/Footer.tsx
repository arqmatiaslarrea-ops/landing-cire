const Footer = () => {
  return (
    <footer className="py-12 bg-background-darker border-t border-border/30">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo / Brand */}
          <div className="text-center md:text-left">
            <span className="text-2xl font-display font-bold gradient-text">CIRE</span>
            <p className="text-sm text-muted-foreground mt-1">
              Compramos propiedades con problemas en Capital Federal
            </p>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Aviso Legal
            </a>
            <a href="/politica-de-privacidad" className="hover:text-primary transition-colors">
              Política de Privacidad
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CIRE. Todos los derechos reservados.
            <br className="md:hidden" />
            <span className="hidden md:inline"> · </span>
            [DIRECCIÓN COMERCIAL] · [TELÉFONO DE CONTACTO]
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
