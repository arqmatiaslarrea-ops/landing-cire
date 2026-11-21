import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import cireLogo from "@/assets/cire-logo.png";

interface HeaderProps {
  onCtaClick: () => void;
}

export const Header = ({ onCtaClick }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass py-3 shadow-soft"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={cireLogo}
            alt="CIRE"
            className={`h-12 md:h-14 transition-all duration-300 ${isScrolled ? "brightness-0" : ""}`}
          />
        </div>

        <Button
          variant={isScrolled ? "cta" : "hero"}
          size="default"
          onClick={onCtaClick}
          className="min-h-[44px] active:scale-95 transition-transform"
        >
          Contactarme con un asesor
        </Button>
      </div>
    </header>
  );
};
