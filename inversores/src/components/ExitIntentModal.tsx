import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LEAD_MAGNET_URL =
  "/guia-fix-and-flip-caba.pdf";

interface ExitIntentModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExitIntentModal = ({ open, onClose }: ExitIntentModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    if (!open) {
      setDone(false);
      setData({ name: "", email: "", phone: "" });
    }
  }, [open]);

  const isValid =
    data.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    data.phone.trim().length >= 7;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Completá nombre, email y teléfono");
      return;
    }
    setSubmitting(true);

    try {
      await supabase.functions.invoke("inv-submit-lead", {
        body: {
          tipo_lead: "frio_pdf",
          nombre: data.name,
          email: data.email,
          telefono: data.phone,
          fuente: "exit_intent_lead_magnet",
        },
      });

      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "lead_magnet_download",
          event_category: "Conversion",
          event_label: "fix_flip_guide",
        });
      }

      // Trigger PDF download
      window.open(LEAD_MAGNET_URL, "_blank");
      setDone(true);
      toast.success("¡Listo! Te enviamos la guía.");
    } catch (err) {
      console.error("Lead magnet error:", err);
      toast.error("Hubo un error. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {!done ? (
          <>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-4 flex-shrink-0">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-3 mx-auto">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <DialogHeader>
                <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-secondary text-center leading-tight">
                  Antes de que te vayas...
                </DialogTitle>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Llevate gratis nuestra <strong className="text-secondary">Guía rápida (2 min) para invertir en Fix &amp; Flip en CABA</strong>.
                </p>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-3 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="lm-name">Nombre completo</Label>
                <Input
                  id="lm-name"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lm-email">Email</Label>
                <Input
                  id="lm-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lm-phone">Teléfono / WhatsApp</Label>
                <Input
                  id="lm-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+54 11 ..."
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full h-12 text-base mt-2"
                disabled={submitting || !isValid}
              >
                <Download className="w-5 h-5" />
                {submitting ? "Enviando..." : "Descargar guía gratis"}
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-secondary transition-colors py-2 min-h-[44px]"
              >
                No, gracias. Cerrar.
              </button>

              <p className="text-[10px] text-center text-muted-foreground">
                Tus datos se usan únicamente para enviarte contenido sobre Fix &amp; Flip. No spam.
              </p>
            </form>
          </>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-secondary mb-2">¡Listo!</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Si la descarga no inició,{" "}
              <a href={LEAD_MAGNET_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                hacé click acá
              </a>
              .
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
