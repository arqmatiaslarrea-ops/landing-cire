import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suppressExitIntent } from "@/hooks/useExitIntent";
import { openWhatsApp } from "@/lib/whatsapp";

interface InvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_NUMBER = "5491154950446";
const BOOKING_URL = "https://calendar.app.google/2j6hvEEhS7o5LcF69";

type FieldKey =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "capitalRange"
  | "timing"
  | "funds"
  | "decision"
  | "experience"
  | "profile"
  | "goal"
  | "notes";

const required = (msg: string) => (v: string) => (v && v.trim() ? "" : msg);

const validators: Partial<Record<FieldKey, (v: string) => string>> = {
  name: (v) => (v.trim().length >= 2 ? "" : "Ingresá tu nombre completo"),
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Ingresá un email válido",
  phone: (v) =>
    v.replace(/\D/g, "").length >= 8
      ? ""
      : "Ingresá un teléfono válido (mínimo 8 dígitos)",
  city: required("Contanos dónde vivís"),
  capitalRange: required("Seleccioná un rango de capital"),
  timing: required("Indicá cuándo querrías invertir"),
  funds: required("Indicá la disponibilidad del capital"),
  decision: required("Indicá quién toma la decisión"),
  experience: required("Contanos tu experiencia previa"),
  profile: required("Seleccioná tu perfil"),
  goal: required("Seleccioná tu objetivo principal"),
};

const STEPS: { title: string; subtitle: string; fields: FieldKey[] }[] = [
  {
    title: "Tus datos",
    subtitle: "Para poder contactarte y preparar la conversación.",
    fields: ["name", "email", "phone", "city"],
  },
  {
    title: "Capital y timing",
    subtitle: "Nos ayuda a saber si hay encaje con los proyectos activos.",
    fields: ["capitalRange", "funds", "timing", "decision"],
  },
  {
    title: "Tu situación y objetivo",
    subtitle: "Últimas preguntas para entender qué buscás.",
    fields: ["experience", "profile", "goal", "notes"],
  },
];

const CAPITAL_OPTIONS = [
  { value: "USD 10k - 50k", label: "USD 10.000 - USD 50.000", score: 1 },
  { value: "USD 50k - 100k", label: "USD 50.000 - USD 100.000", score: 2 },
  { value: "USD 100k - 200k", label: "USD 100.000 - USD 200.000", score: 3 },
  { value: "Más de USD 200k", label: "Más de USD 200.000", score: 4 },
];

const FUNDS_OPTIONS = [
  { value: "Disponible ahora", label: "Disponible ahora", score: 3 },
  { value: "Disponible en 1-7 días", label: "Disponible en 1 a 7 días", score: 2 },
  { value: "Disponible en unas semanas", label: "En un par de semanas", score: 1 },
  { value: "Todavía no definido", label: "Todavía no está definido", score: 0 },
];

const TIMING_OPTIONS = [
  { value: "Este mes", label: "Este mes", score: 3 },
  { value: "Próximos 3 meses", label: "En los próximos 3 meses", score: 2 },
  { value: "Este año", label: "En algún momento de este año", score: 1 },
  { value: "Solo estoy explorando", label: "Solo estoy explorando", score: 0 },
];

const DECISION_OPTIONS = [
  { value: "Decido solo/a", label: "Decido solo/a", score: 2 },
  { value: "Decido con mi pareja/familia", label: "Decido con mi pareja o familia", score: 1 },
  { value: "Decido con un socio", label: "Decido junto a un socio", score: 1 },
  { value: "Invierto por un tercero", label: "Invierto en nombre de un tercero", score: 1 },
];

const EXPERIENCE_OPTIONS = [
  { value: "Sin experiencia", label: "Es mi primera inversión inmobiliaria", score: 0 },
  { value: "Compré 1 propiedad", label: "Ya compré una propiedad", score: 1 },
  { value: "Varias operaciones", label: "Hice varias operaciones inmobiliarias", score: 2 },
  { value: "Fix & Flip previo", label: "Ya participé en un Fix & Flip", score: 3 },
];

const PROFILE_OPTIONS = [
  { value: "Capital declarado", label: "Capital 100% declarado (en blanco)" },
  { value: "Capital mixto", label: "Una combinación de capital declarado y sin declarar" },
  { value: "Capital sin declarar", label: "Capital sin declarar" },
  { value: "Prefiero conversarlo", label: "Prefiero conversarlo personalmente" },
];

const GOAL_OPTIONS = [
  { value: "Plusvalía en el corto plazo", label: "Plusvalía en el corto plazo (Fix & Flip)" },
  { value: "Renta mensual", label: "Renta mensual" },
  { value: "Dolarizar ahorros", label: "Dolarizar y resguardar ahorros" },
  { value: "Diversificar cartera", label: "Diversificar mi cartera" },
];

const scoreOf = (
  options: { value: string; score?: number }[],
  value: string,
) => options.find((o) => o.value === value)?.score ?? 0;

export const InvestmentForm = ({ isOpen, onClose }: InvestmentFormProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false);
  const [formData, setFormData] = useState<Record<FieldKey, string>>({
    name: "",
    email: "",
    phone: "",
    city: "",
    capitalRange: "",
    timing: "",
    funds: "",
    decision: "",
    experience: "",
    profile: "",
    goal: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleBlur = (field: FieldKey) => {
    const validate = validators[field];
    if (!validate) return;
    setErrors((prev) => ({ ...prev, [field]: validate(formData[field]) }));
  };

  const handleChange = (field: FieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = () => {
    const newErrors: Partial<Record<FieldKey, string>> = {};
    currentStep.fields.forEach((field) => {
      const validate = validators[field];
      if (!validate) return;
      const message = validate(formData[field]);
      if (message) newErrors[field] = message;
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) {
      toast.error("Revisá los campos marcados");
      return false;
    }
    return true;
  };

  const computeScore = () =>
    scoreOf(CAPITAL_OPTIONS, formData.capitalRange) +
    scoreOf(FUNDS_OPTIONS, formData.funds) +
    scoreOf(TIMING_OPTIONS, formData.timing) +
    scoreOf(DECISION_OPTIONS, formData.decision) +
    scoreOf(EXPERIENCE_OPTIONS, formData.experience);

  const submitLead = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("inv-submit-lead", {
        body: {
          tipo_lead: "calificado",
          nombre: formData.name.trim(),
          email: formData.email.trim(),
          telefono: formData.phone.trim(),
          capital: formData.capitalRange,
          perfil: formData.profile,
          experiencia: formData.experience,
          plazo: `${formData.timing} · Fondos: ${formData.funds}`,
          objetivo: formData.goal,
          decision: formData.decision,
          ciudad: formData.city.trim(),
          notas: formData.notes.trim(),
          score: computeScore(),
          fuente: "investment_form",
        },
      });

      if (error) throw error;

      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "form_submit",
          event_category: "Conversion",
          event_label: "investment_form",
          lead_score: computeScore(),
        });
      }

      setSuccess(true);
      toast.success("Formulario enviado correctamente");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error("Error al enviar el formulario.", {
        description: "Tus datos se conservaron. Podés reintentar.",
        action: { label: "Reintentar", onClick: () => submitLead() },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep) {
      submitLead();
      return;
    }
    if (validateStep()) setStepIndex((i) => i + 1);
  };

  const handleWhatsApp = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "whatsapp_click",
        event_category: "Conversion",
        event_label: "post_form_submit",
      });
    }

    setOpeningWhatsApp(true);
    const message =
      `Hola Matías, soy ${formData.name}. Acabo de completar el formulario en la web de CIRE.\n\n` +
        `* Ciudad: ${formData.city}\n` +
        `* Capital: ${formData.capitalRange}\n` +
        `* Fondos: ${formData.funds}\n` +
        `* Timing: ${formData.timing}\n` +
        `* Experiencia: ${formData.experience}\n` +
        `* Objetivo: ${formData.goal}\n\n` +
        `Quedo atento/a para coordinar una conversación.`;
    suppressExitIntent();
    openWhatsApp(WHATSAPP_NUMBER, message);
    setTimeout(() => setOpeningWhatsApp(false), 1500);
  };

  const handleCalendar = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "schedule_click",
        event_category: "Conversion",
        event_label: "post_form_submit",
      });
    }
    suppressExitIntent();
    window.open(BOOKING_URL, "_blank");
  };

  const handleClose = () => {
    setStepIndex(0);
    setSuccess(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      capitalRange: "",
      timing: "",
      funds: "",
      decision: "",
      experience: "",
      profile: "",
      goal: "",
      notes: "",
    });
    setErrors({});
    onClose();
  };

  const fieldError = (field: FieldKey) =>
    errors[field] ? (
      <p aria-live="polite" className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const renderSelect = (
    field: FieldKey,
    label: string,
    options: { value: string; label: string }[],
    placeholder: string,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Select
        value={formData[field]}
        onValueChange={(value) => handleChange(field, value)}
        disabled={isSubmitting}
      >
        <SelectTrigger
          className={`h-11 text-base ${errors[field] ? "border-destructive" : ""}`}
          aria-invalid={Boolean(errors[field])}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldError(field)}
    </div>
  );

  const renderInput = (
    field: FieldKey,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-sm">{label}</Label>
      <Input
        id={field}
        name={field}
        disabled={isSubmitting}
        aria-invalid={Boolean(errors[field])}
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        onBlur={() => handleBlur(field)}
        {...props}
        className={`h-11 text-base ${errors[field] ? "border-destructive" : ""}`}
      />
      {fieldError(field)}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[92dvh] flex flex-col">
        {!success ? (
          <>
            <DialogHeader className="p-5 pb-0 flex-shrink-0">
              <DialogTitle className="font-display text-xl font-bold text-secondary">
                {currentStep.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>

              <div className="flex items-center gap-2 pt-3">
                {STEPS.map((s, i) => (
                  <div
                    key={s.title}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= stepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-1.5">
                Paso {stepIndex + 1} de {STEPS.length}
              </p>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="p-5 pt-3 space-y-3 overflow-y-auto flex-1"
            >
              {stepIndex === 0 && (
                <>
                  {renderInput("name", "Nombre completo", {
                    autoComplete: "name",
                    placeholder: "Tu nombre",
                  })}
                  {renderInput("email", "Email", {
                    type: "email",
                    autoComplete: "email",
                    placeholder: "tu@email.com",
                  })}
                  {renderInput("phone", "Teléfono / WhatsApp", {
                    type: "tel",
                    autoComplete: "tel",
                    placeholder: "+54 11 5495 0446",
                  })}
                  {renderInput("city", "Ciudad de residencia", {
                    placeholder: "Buenos Aires, Argentina",
                  })}
                </>
              )}

              {stepIndex === 1 && (
                <>
                  {renderSelect(
                    "capitalRange",
                    "Capital disponible estimado",
                    CAPITAL_OPTIONS,
                    "Seleccioná un rango",
                  )}
                  {renderSelect(
                    "funds",
                    "¿Cuándo tendrías el capital disponible?",
                    FUNDS_OPTIONS,
                    "Seleccioná una opción",
                  )}
                  {renderSelect(
                    "timing",
                    "¿Cuándo te gustaría invertir?",
                    TIMING_OPTIONS,
                    "Seleccioná una opción",
                  )}
                  {renderSelect(
                    "decision",
                    "¿Quién toma la decisión de inversión?",
                    DECISION_OPTIONS,
                    "Seleccioná una opción",
                  )}
                </>
              )}

              {stepIndex === 2 && (
                <>
                  {renderSelect(
                    "experience",
                    "Experiencia previa en real estate",
                    EXPERIENCE_OPTIONS,
                    "Seleccioná una opción",
                  )}
                  {renderSelect(
                    "profile",
                    "¿El capital que invertirías tiene alguna condición fiscal a tener en cuenta?",
                    PROFILE_OPTIONS,
                    "Seleccioná una opción",
                  )}
                  {renderSelect(
                    "goal",
                    "Objetivo principal",
                    GOAL_OPTIONS,
                    "Seleccioná tu objetivo",
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">
                      ¿Qué querés lograr con esta inversión?{" "}
                      <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      maxLength={500}
                      disabled={isSubmitting}
                      placeholder="Contame brevemente tu situación y qué estás buscando."
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="text-base"
                    />
                  </div>
                </>
              )}

              <div className="pt-1 pb-1 sticky bottom-0 bg-background space-y-1.5">
                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  className="w-full h-11 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      {isLastStep ? "Enviar solicitud" : "Continuar"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-9"
                    onClick={() => setStepIndex((i) => i - 1)}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground pt-1">
                  Tu información es confidencial. Te contactamos dentro de las 24hs hábiles.
                </p>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 text-center overflow-y-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <h3 className="font-display text-2xl font-bold text-secondary mb-2">
              ¡Gracias, {formData.name.split(" ")[0]}!
            </h3>
            <p className="text-lg text-secondary/80 font-medium mb-2">
              Tu solicitud fue recibida exitosamente
            </p>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Para avanzar más rápido, escribime por WhatsApp o agendá una reunión conmigo,
              Arq. Matías Larrea.
            </p>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-12"
                onClick={handleWhatsApp}
                disabled={openingWhatsApp}
                data-gtm="click_whatsapp"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {openingWhatsApp ? "Abriendo WhatsApp..." : "Escribirle a Matías por WhatsApp"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-secondary/20 hover:bg-secondary/5 h-12"
                onClick={handleCalendar}
                data-gtm="click_schedule"
              >
                <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                Agendar reunión con el Arq. Matías Larrea
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Nos pondremos en contacto dentro de las próximas 24hs hábiles.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
