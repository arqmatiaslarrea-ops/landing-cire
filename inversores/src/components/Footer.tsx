import cireLogo from "@/assets/cire-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-cire-blue-deep">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
            <img src={cireLogo} alt="CIRE" className="h-12 md:h-14" />

          {/* Legal links */}
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-white transition-colors">
              Política de privacidad
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Términos legales
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/40">
            © {currentYear} CIRE. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
