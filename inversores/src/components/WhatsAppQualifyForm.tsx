import { useState } from "react";
import AgendaLlamada from "@/components/AgendaLlamada";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Loader2, CheckCircle2, CalendarDays, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suppressExitIntent } from "@/hooks/useExitIntent";
import { openWhatsApp } from "@/lib/whatsapp";

const WHATSAPP_NUMBER = "5491154950446";

type WaFieldKey = "name" | "phone" | "email" | "city";

const waValidators: Record<WaFieldKey, (v: string) => string> = {
  name: (v) => (v.trim().length >= 2 ? "" : "Ingresá tu nombre completo"),
  phone: (v) =>
    v.replace(/\D/g, "").length >= 8
      ? ""
      : "Ingresá un teléfono válido (mínimo 8 dígitos)",
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Ingresá un email válido",
  city: (v) => (v.trim().length >= 2 ? "" : "Contanos dónde vivís"),
};

interface WhatsAppQualifyFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROFILE_OPTIONS = [
  { value: "conservador", label: "Conservador – priorizo seguridad" },
  { value: "moderado", label: "Moderado – balance riesgo/retorno" },
  { value: "agresivo", label: "Agresivo – priorizo rentabilidad" },
];

const CAPITAL_OPTIONS = [
  { value: "USD 10k - 50k", label: "USD 10.000 - USD 50.000", score: 1 },
  { value: "USD 50k - 100k", label: "USD 50.000 - USD 100.000", score: 2 },
  { value: "USD 100k - 200k", label: "USD 100.000 - USD 200.000", score: 3 },
  { value: "Más de USD 200k", label: "Más de USD 200.000", score: 4 },
];

const TIMING_OPTIONS = [
  { value: "Este mes", label: "Este mes", score: 3 },
  { value: "Próximos 3 meses", label: "En los próximos 3 meses", score: 2 },
  { value: "Este año", label: "En algún momento de este año", score: 1 },
  { value: "Solo estoy explorando", label: "Solo estoy explorando", score: 0 },
];

const scoreOf = (options: { value: string; score?: number }[], value: string) =>
  options.find((o) => o.value === value)?.score ?? 0;

export const WhatsAppQualifyForm = ({ isOpen, onClose }: WhatsAppQualifyFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    capitalRange: "",
    timing: "",
    firstTime: "",
    profile: "",
  });
  const [errors, setErrors] = useState<Partial<Record<WaFieldKey, string>>>({});

  const handleFieldBlur = (field: WaFieldKey) => {
    setErrors((prev) => ({ ...prev, [field]: waValidators[field](formData[field]) }));
  };

  const handleFieldChange = (field: WaFieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const fieldError = (field: WaFieldKey) =>
    errors[field] ? (
      <p aria-live="polite" className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const isValid =
    formData.name.trim().length >= 2 &&
    formData.phone.trim().length >= 7 &&
    formData.email.trim().length >= 5 &&
    formData.city.trim().length >= 2 &&
    formData.capitalRange &&
    formData.timing &&
    formData.firstTime &&
    formData.profile;

  const computeScore = () =>
    scoreOf(CAPITAL_OPTIONS, formData.capitalRange) +
    scoreOf(TIMING_OPTIONS, formData.timing) +
    (formData.firstTime === "si" ? 0 : 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setErrors({
        name: waValidators.name(formData.name),
        phone: waValidators.phone(formData.phone),
        email: waValidators.email(formData.email),
        city: waValidators.city(formData.city),
      });
      toast.error("Revisá los campos marcados");
      return;
    }

    setIsSubmitting(true);

    try {
      // GTM tracking
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "whatsapp_qualified_click",
          event_category: "Conversion",
          event_label: "whatsapp_qualify_form",
        });
      }

      // Build WhatsApp message
      const profileLabel = PROFILE_OPTIONS.find((p) => p.value === formData.profile)?.label ?? formData.profile;
      const firstTimeLabel = formData.firstTime === "si" ? "Sí, es mi primera vez" : "No, tengo experiencia";

      const message =
        `Hola, soy ${formData.name}. Completé el formulario en la web de CIRE.\n\n` +
        `📞 *Teléfono:* ${formData.phone}\n` +
        `📧 *Email:* ${formData.email}\n` +
        `📍 *Ciudad:* ${formData.city}\n` +
        `💰 *Capital estimado:* ${formData.capitalRange}\n` +
        `🗓️ *Cuándo invertiría:* ${formData.timing}\n` +
        `🏠 *Primera inversión en RE:* ${firstTimeLabel}\n` +
        `📊 *Perfil:* ${profileLabel}\n\n` +
        `Quedo atento/a para coordinar una conversación.`;

      // Abrimos una pestaña en blanco AHORA (dentro del click) para esquivar
      // el popup blocker, y la redirigimos a WhatsApp solo DESPUÉS de guardar
      // el lead. Si abriéramos WhatsApp antes, la navegación (location.assign
      // en mobile) descarga la página y aborta el guardado -> lead perdido.
      suppressExitIntent();
      const waTab = window.open("", "_blank");

      try {
        const { data: respuesta, error } = await supabase.functions.invoke("inv-submit-lead", {
          body: {
            tipo_lead: "whatsapp_rapido",
            nombre: formData.name,
            email: formData.email,
            telefono: formData.phone,
            capital: formData.capitalRange,
            // La columna "perfil" del Sheet es Condición fiscal (form de 3 pasos):
            // este form no la pregunta, así que va vacía.
            perfil: "",
            experiencia: formData.firstTime === "si" ? "Sin experiencia" : "Con experiencia",
            fuente: "whatsapp_qualify_form",
            plazo: formData.timing,
            ciudad: formData.city,
            score: computeScore(),
            notas: `Perfil inversor: ${profileLabel}`,
          },
        });
        if (error) console.error("Error saving lead:", error);
        else if ((respuesta as any)?.id) setLeadId((respuesta as any).id);
      } catch (err) {
        console.error("Error saving lead:", err);
      }

      // Lead ya guardado: ahora sí redirigir la pestaña a WhatsApp
      openWhatsApp(WHATSAPP_NUMBER, message, waTab);

      // Mostrar pantalla de éxito con opción de agendar reunión
      setLastMessage(message);
      setSubmitted(true);
      toast.success("¡Listo! Se abrió WhatsApp con tu información.");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error al enviar. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenWhatsApp = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "whatsapp_click",
        event_category: "Conversion",
        event_label: "whatsapp_qualify_success",
      });
    }
    suppressExitIntent();
    openWhatsApp(WHATSAPP_NUMBER, lastMessage);
  };

  const handleCalendar = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "schedule_click",
        event_category: "Conversion",
        event_label: "whatsapp_qualify_success",
      });
    }
    suppressExitIntent();
    setAgendando(true);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "",
      capitalRange: "",
      timing: "",
      firstTime: "",
      profile: "",
    });
    setErrors({});
    setSubmitted(false);
    setAgendando(false);
    setLeadId(null);
    setLastMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="font-display text-2xl font-bold text-secondary">
            Consultar por WhatsApp
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Completá estos datos y te conectamos directo con un asesor por WhatsApp.
          </p>
        </DialogHeader>

        {submitted && agendando ? (
          <div className="p-6 pt-4 overflow-y-auto flex-1">
            <AgendaLlamada leadId={leadId} origenLead="inv" nombre={formData.name.trim()} telefono={formData.phone.trim()} email={formData.email.trim() || undefined} unidad="desarrolladora" origen="cireinversores.com (WhatsApp)" onVolver={() => setAgendando(false)} />
          </div>
        ) : submitted ? (
          <div className="p-6 pt-4 space-y-4 overflow-y-auto flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-[#25D366]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-secondary">
                ¡Datos enviados!
              </h3>
              <p className="text-muted-foreground text-sm">
                Se abrió WhatsApp con tu mensaje listo para enviar. También
                podés agendar directamente una reunión con el Arq. Matías Larrea.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleReopenWhatsApp}
              data-gtm="click_whatsapp"
              className="w-full h-11 text-base bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Abrir WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCalendar}
              data-gtm="click_schedule"
              className="w-full h-11 text-base"
            >
              <CalendarDays className="w-5 h-5 mr-2 text-primary" />
              Agendar reunión con el Arq. Matías Larrea
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-3 overflow-y-auto flex-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="wa-name">Nombre completo *</Label>
            <Input
              id="wa-name"
              autoComplete="name"
              placeholder="Tu nombre"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              className={`h-11 text-base ${errors.name ? "border-destructive" : ""}`}
            />
            {fieldError("name")}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="wa-phone">Teléfono / WhatsApp *</Label>
            <Input
              id="wa-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+54 11 5495 0446"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.phone)}
              value={formData.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={() => handleFieldBlur("phone")}
              className={`h-11 text-base ${errors.phone ? "border-destructive" : ""}`}
            />
            {fieldError("phone")}
          </div>

          {/* Email (required) */}
          <div className="space-y-2">
            <Label htmlFor="wa-email">Email *</Label>
            <Input
              id="wa-email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className={`h-11 text-base ${errors.email ? "border-destructive" : ""}`}
            />
            {fieldError("email")}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="wa-city">Ciudad de residencia *</Label>
            <Input
              id="wa-city"
              autoComplete="address-level2"
              placeholder="CABA, Rosario, Madrid..."
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.city)}
              value={formData.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              onBlur={() => handleFieldBlur("city")}
              className={`h-11 text-base ${errors.city ? "border-destructive" : ""}`}
            />
            {fieldError("city")}
          </div>

          {/* Capital Range */}
          <div className="space-y-2">
            <Label>Capital disponible estimado *</Label>
            <Select
              value={formData.capitalRange}
              onValueChange={(value) => setFormData({ ...formData, capitalRange: value })}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Selecciona un rango" />
              </SelectTrigger>
              <SelectContent>
                {CAPITAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <Label>¿Cuándo te gustaría invertir? *</Label>
            <Select
              value={formData.timing}
              onValueChange={(value) => setFormData({ ...formData, timing: value })}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Selecciona un plazo" />
              </SelectTrigger>
              <SelectContent>
                {TIMING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* First time investing in RE */}
          <div className="space-y-3">
            <Label>¿Es tu primera inversión en real estate? *</Label>
            <RadioGroup
              value={formData.firstTime}
              onValueChange={(value) => setFormData({ ...formData, firstTime: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="si" id="ft-si" />
                <Label htmlFor="ft-si" className="font-normal cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="ft-no" />
                <Label htmlFor="ft-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Investor Profile */}
          <div className="space-y-2">
            <Label>Perfil de inversor *</Label>
            <Select
              value={formData.profile}
              onValueChange={(value) => setFormData({ ...formData, profile: value })}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Selecciona tu perfil" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <div className="pt-3 pb-1 sticky bottom-0 bg-background border-t border-border/60">
            <Button
              type="submit"
              className="w-full h-11 text-base bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Continuar por WhatsApp
                </>
              )}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Tus datos se guardan para que un asesor pueda preparar la conversación.
            </p>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
