import { useEffect, useState } from "react";

// Botón fijo en celular: aparece al bajar y se oculta cuando el formulario está a la vista.
const BarraMovil = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("formulario");
    let formVisible = false;
    const obs = form
      ? new IntersectionObserver(([e]) => {
          formVisible = e.isIntersecting;
          actualizar();
        })
      : null;
    const actualizar = () => setVisible(window.scrollY > 700 && !formVisible);
    if (form && obs) obs.observe(form);
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => {
      window.removeEventListener("scroll", actualizar);
      obs?.disconnect();
    };
  }, []);

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur px-4 py-3 transition-transform ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <a
        href="#formulario"
        tabIndex={visible ? 0 : -1}
        className="recorte block bg-primary py-3.5 text-center font-bold text-primary-foreground"
      >
        Pedir mi oferta en 48 hs
      </a>
    </div>
  );
};

export default BarraMovil;
