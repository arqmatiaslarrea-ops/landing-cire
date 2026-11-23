import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastAction } from "@/components/ui/toast";
import {
  CheckCircle,
  ArrowRight,
  Clock,
  AlertTriangle,
  Calendar,
  MessageCircle,
  MapPin,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgendaLlamada from "@/components/AgendaLlamada";

const WHATSAPP_NUMBER = "5491154950446";
const DUPLICATE_KEY = "cire_form_submitted";
const ACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
// Anti-spam: localStorage duplicate check is the primary protection

const problemTypeLabels: Record<string, string> = {
  herencia: "Propiedad heredada",
  deterioro: "Propiedad en mal estado",
  legal: "Deudas o embargos",
  urgencia: "Urgencia de venta",
  inversion: "Inversión que no funcionó",
  otro: "Otra situación compleja",
};

const urgencyLabels: Record<string, string> = {
  urgente: "Urgente (menos de 2 meses)",
  pronto: "Pronto (2-6 meses)",
  flexible: "Flexible",
};

const priceLabels: Record<string, string> = {
  realista: "Precio justo por venta rápida",
  flexible: "Dispuesto a negociar",
  maximo: "Precio máximo de mercado",
};

const propertyTypeOptions = [
  "Departamento",
  "Casa",
  "Ph",
  "Lote",
  "Comercio",
  "Galpón",
  "Otro",
];

const roomsCountOptions = [
  "Monoambiente",
  "Dos Ambientes",
  "Tres Ambientes",
  "Cuatro Ambientes",
  "Mas de 4 Ambientes",
];

const LeadForm = ({ situacion = "" }: { situacion?: string }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);
  const [sheetSaveError, setSheetSaveError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formStartedRef = useRef(false);

  const pushFormStartToDataLayer = () => {
    if (typeof window === "undefined") return;
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "lead_form_start",
      form_name: "CIRE vendedores",
      form_id: "lead_form",
      page: window.location.pathname,
    });
  };

  const [formData, setFormData] = useState({
    isInCaba: "",
    problemType: "",
    urgency: "",
    priceExpectation: "",
    propertyType: "",
    roomsCount: "",
    name: "",
    phone: "",
    email: "",
    propertyAddress: "",
    neighborhood: "",
    expectedPrice: "",
    additionalInfo: "",
    hasExpenses: "",
    propertySize: "",
    whatsappConsent: "",
  });

  // Situación elegida en el hero: precarga el primer paso y vuelve a ese paso
  useEffect(() => {
    if (!situacion) return;
    setFormData((prev) => ({ ...prev, problemType: situacion }));
    setStep(1);
  }, [situacion]);

  // Check for duplicate submission on mount
  useEffect(() => {
    const submitted = localStorage.getItem(DUPLICATE_KEY);
    if (submitted) {
      setAlreadySubmitted(true);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    pushFormStartToDataLayer();
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildLeadPayload = () => ({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    propertyAddress: formData.propertyAddress,
    neighborhood: formData.neighborhood,
    propertyType: formData.propertyType,
    roomsCount: formData.roomsCount,
    problemType: problemTypeLabels[formData.problemType] || formData.problemType,
    urgency: urgencyLabels[formData.urgency] || formData.urgency,
    priceExpectation:
      priceLabels[formData.priceExpectation] || formData.priceExpectation,
    expectedPrice: formData.expectedPrice,
    additionalInfo: formData.additionalInfo,
    hasExpenses: formData.hasExpenses,
    propertySize: formData.propertySize,
    consentWhatsapp: formData.whatsappConsent === "si" ? "Sí" : "No",
  });

  const saveToGoogleSheets = async () => {
    setIsSavingToSheet(true);
    setSheetSaveError(null);

    try {
      const { data, error } = await supabase.functions.invoke("inmo-submit-lead", {
        body: buildLeadPayload(),
      });

      if (error) throw new Error(error.message || "No pudimos guardar tus datos");
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.id) setLeadId((data as any).id);

      console.log("Lead guardado en Google Sheets exitosamente");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error enviando a Google Sheets:", err);
      setSheetSaveError(message);

      toast({
        title: "No pudimos guardar tus datos",
        description:
          "Podés continuar por WhatsApp igual. También podés reintentar desde la siguiente pantalla.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsSavingToSheet(false);
    }
  };

  const sendFollowupAlert = async () => {
    if (actionTaken) return; // Don't send if user already took action
    
    console.log("Sending followup alert - user did not take action");
    
    try {
      const payload = buildLeadPayload();
      const { error } = await supabase.functions.invoke("inmo-followup", {
        body: {
          leadName: payload.name,
          leadEmail: payload.email,
          leadPhone: payload.phone,
          propertyAddress: payload.propertyAddress,
          neighborhood: payload.neighborhood,
          problemType: payload.problemType,
          urgency: payload.urgency,
          priceExpectation: payload.priceExpectation,
          expectedPrice: payload.expectedPrice,
          additionalInfo: payload.additionalInfo,
        },
      });

      if (error) {
        console.error("Error sending followup alert:", error);
      } else {
        console.log("Followup alert sent successfully");
      }
    } catch (err) {
      console.error("Error sending followup alert:", err);
    }
  };

  const startActionTimeout = () => {
    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    
    // Set new timeout
    alertTimeoutRef.current = setTimeout(() => {
      sendFollowupAlert();
    }, ACTION_TIMEOUT_MS);
  };

  const markActionTaken = () => {
    setActionTaken(true);
    // Clear the timeout since user took action
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  };

  const buildWhatsAppMessage = () => {
    const problem =
      problemTypeLabels[formData.problemType] ||
      formData.problemType ||
      "No especificado";
    const urgency =
      urgencyLabels[formData.urgency] || formData.urgency || "No especificado";
    const price =
      priceLabels[formData.priceExpectation] ||
      formData.priceExpectation ||
      "No especificado";

    const message = [
      `Hola CIRE, ¿cómo están? Soy ${formData.name || ""}.`,
      "Quisiera que analicen si les interesa comprar mi propiedad.",
      "",
      `Dirección: ${formData.propertyAddress || "—"}`,
      `Barrio: ${formData.neighborhood || "—"}`,
      `Tipo de propiedad: ${formData.propertyType || "No especificado"}`,
      `Ambientes: ${formData.roomsCount || "No especificado"}`,
      `Paga expensas: ${formData.hasExpenses || "No especificado"}`,
      `Tamaño (m²): ${formData.propertySize || "No especificado"}`,
      `Situación: ${problem}`,
      `Urgencia: ${urgency}`,
      `Expectativa de precio: ${price}`,
      `Precio pretendido: ${formData.expectedPrice || "No especificado"}`,
      `Info adicional: ${formData.additionalInfo || "Sin información adicional"}`,
      "",
      `Contacto: ${formData.phone || ""}${
        formData.email ? ` | ${formData.email}` : ""
      }`,
    ]
      .filter(Boolean)
      .join("\n");

    return encodeURIComponent(message);
  };

  const getWhatsAppUrl = () => {
    const text = buildWhatsAppMessage();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobi/i.test(ua);

    // En desktop evitamos el redirect de wa.me a api.whatsapp.com usando web.whatsapp.com
    return isMobile
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
      : `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`;
  };

  // ✅ GTM event SOLO cuando el backend responde OK
  const pushLeadSubmitToDataLayer = () => {
    if (typeof window === "undefined") return;
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "lead_form_submit",
      form_name: "CIRE vendedores",
      form_id: "lead_form",
      page: window.location.pathname,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-click while submitting
    if (isSubmitting) return;

    // Consentimiento obligatorio: no se envía sin autorización de contacto por WhatsApp
    if (formData.whatsappConsent !== "si") {
      toast({
        title: "Falta un paso",
        description:
          "Marcá la casilla para que CIRE te contacte por WhatsApp sobre tu consulta.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate (anti-spam via localStorage)
    if (localStorage.getItem(DUPLICATE_KEY)) {
      toast({
        title: "Ya enviaste una consulta",
        description: "Si necesitás hacer otra consulta, contactanos directamente por WhatsApp.",
        variant: "destructive",
      });
      setAlreadySubmitted(true);
      return;
    }

    setIsSubmitting(true);

    // Mark as submitted IMMEDIATELY to prevent duplicates
    localStorage.setItem(DUPLICATE_KEY, Date.now().toString());

    // Show success screen right away
    setIsSubmitted(true);

    // Start timeout for followup alert
    startActionTimeout();

    // Save to Google Sheets in background (non-blocking)
    saveToGoogleSheets().then((ok) => {
      if (ok) {
        pushLeadSubmitToDataLayer();
      }
    });
  };

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // ignore
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const copyWhatsAppLink = async () => {
    const url = getWhatsAppUrl();
    const ok = await copyToClipboard(url);
    toast({
      title: ok ? "Link copiado" : "No se pudo copiar",
      description: ok
        ? "Pegalo en tu navegador o compartilo por donde quieras."
        : "Copialo manualmente desde la barra de direcciones.",
    });
  };

  const openWhatsApp = () => {
    markActionTaken(); // User took action
    
    const url = getWhatsAppUrl();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobi/i.test(ua);

    // En mobile, mejor navegar directo (evita bloqueos de popups en iOS / in-app browsers)
    if (isMobile) {
      window.location.href = url;
      return;
    }

    let opened = false;
    try {
      opened = !!window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      opened = false;
    }

    // Fallback (algunos iframes bloquean popups)
    if (!opened) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Si WhatsApp se bloquea en el preview",
        description: "Copiá el link y abrilo en otra pestaña o probá en la versión publicada.",
        action: (
          <ToastAction altText="Copiar link" onClick={copyWhatsAppLink}>
            Copiar link
          </ToastAction>
        ),
      });
    }
  };

  const [agendando, setAgendando] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const openGoogleCalendar = () => {
    // La acción cuenta recién cuando confirma la reserva: si abre la agenda y se va, sale la alerta de "no hizo nada"
    setAgendando(true);
  };

  const canProceedStep1 =
    formData.problemType !== "" && formData.isInCaba === "si";
  const canProceedStep2 =
    formData.urgency !== "" && formData.priceExpectation !== "";
  const canSubmit =
    formData.name &&
    formData.phone &&
    formData.propertyAddress &&
    formData.neighborhood &&
    formData.propertyType &&
    formData.roomsCount &&
    formData.whatsappConsent === "si";

  // Show message if already submitted
  if (alreadySubmitted && !isSubmitted) {
    return (
      <div className="animate-scale-in">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>

          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            Ya enviaste una consulta
          </h3>
          <p className="text-lg text-muted-foreground mb-6">
            Si necesitás hacer otra consulta o tenés dudas, contactanos directamente:
          </p>

          <Button
            onClick={() => {
              window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
            }}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-7 text-xl shadow-button transition-colors"
          >
            <MessageCircle className="mr-3 w-6 h-6" />
            Contactar por WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted && agendando) {
    const ubicacion = [formData.propertyAddress, formData.neighborhood].filter(Boolean).join(", ");
    return (
      <div className="animate-scale-in">
        <AgendaLlamada
          leadId={leadId}
          origenLead="inmo"
          nombre={formData.name}
          telefono={formData.phone}
          email={formData.email || undefined}
          unidad="inmobiliaria"
          origen="cireinmobiliaria.com"
          nota={ubicacion ? `Propiedad: ${ubicacion}` : undefined}
          onVolver={() => setAgendando(false)}
          onAgendado={() => markActionTaken()}
        />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="animate-scale-in">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-accent" />
          </div>

          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            ¡Último paso, {formData.name}!
          </h3>
          <p className="text-lg text-foreground mb-2">
            Para completar tu consulta, iniciá la conversación por WhatsApp
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Haciendo clic en el botón se abre WhatsApp con un mensaje conversacional con todos los datos que completaste.
          </p>

          {sheetSaveError ? (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left">
              <p className="text-sm text-foreground font-medium mb-1">
                No pudimos registrar tu consulta en la planilla.
              </p>
              <p className="text-xs text-muted-foreground mb-3 break-words">
                Motivo: <span className="font-mono">{sheetSaveError}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={saveToGoogleSheets}
                disabled={isSavingToSheet}
                className="w-full border-border text-foreground hover:bg-secondary"
              >
                {isSavingToSheet ? "Reintentando..." : "Reintentar guardar en planilla"}
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            <Button
              onClick={openWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-7 text-xl shadow-button transition-colors animate-pulse-glow"
            >
              <MessageCircle className="mr-3 w-6 h-6" />
              Iniciar conversación en WhatsApp
            </Button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-sm text-muted-foreground">
                  o si preferís
                </span>
              </div>
            </div>

            <Button
              onClick={openGoogleCalendar}
              variant="outline"
              className="w-full border-border text-muted-foreground font-medium py-5 text-base hover:bg-secondary transition-colors"
            >
              <Calendar className="mr-2 w-4 h-4" />
              Agendar llamada telefónica
            </Button>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-foreground font-medium">
                ⚡ Respondemos en menos de 48hs hábiles
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={`step-${s}`} className="flex items-center flex-1 min-w-0">
            <div
              className={`w-10 h-10 flex-none rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-300 ${
                step >= s
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>

            {s < 3 && (
              <div
                aria-hidden="true"
                className={`h-1 flex-1 min-w-0 mx-2 rounded transition-all duration-300 ${
                  step > s ? "gradient-primary" : "bg-secondary"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Problem Type */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            {/* Filtro binario: ubicación CABA */}
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                ¿Tu propiedad está dentro de Capital Federal (CABA)?
              </h3>
              <p className="text-muted-foreground text-sm">
                Compramos únicamente propiedades ubicadas en CABA
              </p>
            </div>

            <RadioGroup
              value={formData.isInCaba}
              onValueChange={(value) => handleChange("isInCaba", value)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Label
                htmlFor="caba-si"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  formData.isInCaba === "si"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-background/30"
                }`}
              >
                <RadioGroupItem value="si" id="caba-si" />
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">Sí, está en CABA</span>
              </Label>

              <Label
                htmlFor="caba-no"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  formData.isInCaba === "no"
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50 bg-background/30"
                }`}
              >
                <RadioGroupItem value="no" id="caba-no" />
                <XCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="font-medium text-foreground">No, está fuera de CABA</span>
              </Label>
            </RadioGroup>

            {formData.isInCaba === "no" && (
              <div className="bg-accent/10 border-2 border-accent rounded-lg p-5 animate-fade-up">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-display font-bold text-foreground">
                      No podemos avanzar con tu consulta
                    </p>
                    <p className="text-sm text-foreground">
                      Compramos <strong>únicamente</strong> propiedades dentro de Capital Federal
                      (CABA). Si tu propiedad está fuera de CABA, lamentablemente no podemos
                      hacer una oferta.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gracias por tu tiempo. Si en el futuro tenés una propiedad en CABA,
                      vamos a estar encantados de analizarla.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.isInCaba !== "no" && (
              <>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    ¿Qué situación describe mejor tu caso?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Esto nos ayuda a entender si podemos ser tus compradores
                  </p>
                </div>

                <RadioGroup
                  value={formData.problemType}
                  onValueChange={(value) => handleChange("problemType", value)}
                  className="space-y-3"
                >
                  {[
                    {
                      value: "herencia",
                      label: "Propiedad heredada",
                      desc: "Sucesión, herederos, trámites pendientes",
                    },
                    {
                      value: "deterioro",
                      label: "Necesita mucha obra",
                      desc: "Humedades, instalaciones viejas, deterioro general",
                    },
                    {
                      value: "legal",
                      label: "Deudas o embargos",
                      desc: "Expensas o impuestos atrasados, embargos, usufructo",
                    },
                    {
                      value: "urgencia",
                      label: "Necesito vender rápido",
                      desc: "Tengo que vender en poco tiempo",
                    },
                    {
                      value: "otro",
                      label: "Otra situación compleja",
                      desc: "Tengo otro problema que dificulta la venta",
                    },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.problemType === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-background/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <div>
                        <span className="font-medium text-foreground block">{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.desc}</span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </>
            )}

            {formData.isInCaba === "no" ? (
              <Button
                type="button"
                disabled
                className="w-full bg-secondary text-muted-foreground font-semibold py-6 text-lg cursor-not-allowed"
              >
                No podés continuar
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full gradient-cta text-primary-foreground font-semibold py-6 text-lg shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Continuar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Urgency & Expectations */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                ¿Cuál es tu situación actual?
              </h3>
              <p className="text-muted-foreground text-sm">
                Sé honesto, esto nos ayuda a darte una respuesta real
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                ¿Qué tan urgente es vender?
              </Label>
              <RadioGroup
                value={formData.urgency}
                onValueChange={(value) => handleChange("urgency", value)}
                className="space-y-2"
              >
                {[
                  { value: "urgente", label: "Urgente (menos de 2 meses)" },
                  { value: "pronto", label: "Pronto (2-6 meses)" },
                  { value: "flexible", label: "Flexible (puedo esperar)" },
                ].map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`urgency-${option.value}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.urgency === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-background/30"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`urgency-${option.value}`} />
                    <span className="text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                ¿Qué esperas del precio?
              </Label>
              <RadioGroup
                value={formData.priceExpectation}
                onValueChange={(value) => handleChange("priceExpectation", value)}
                className="space-y-2"
              >
                {[
                  { value: "realista", label: "Precio justo por una venta rápida y segura" },
                  { value: "flexible", label: "Estoy dispuesto a negociar según la oferta" },
                  { value: "maximo", label: "Quiero el precio máximo de mercado" },
                ].map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`price-${option.value}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.priceExpectation === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-background/30"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`price-${option.value}`} />
                    <span className="text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {formData.priceExpectation === "maximo" && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 animate-fade-up">
                <p className="text-sm text-foreground">
                  <strong>Importante:</strong> Nosotros compramos propiedades con descuento porque
                  asumimos el riesgo y los problemas. Si buscas precio máximo de mercado, una
                  inmobiliaria tradicional puede ser mejor opción para vos.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 py-6 border-border text-foreground hover:bg-secondary"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 gradient-cta text-primary-foreground font-semibold py-6 shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Continuar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Tus datos de contacto
              </h3>
              <p className="text-muted-foreground text-sm">
                Te contactaremos solo si tu caso encaja con nuestro perfil de compra
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-foreground">
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="+54 11 1234-5678"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">
                  Dirección de la propiedad *
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.propertyAddress}
                  onChange={(e) => handleChange("propertyAddress", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: Av. Corrientes 1234"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Indicá calle y altura. Solo compramos en Capital Federal.
                </p>
              </div>

              <div>
                <Label htmlFor="neighborhood" className="text-foreground">
                  Barrio *
                </Label>
                <Input
                  id="neighborhood"
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: Almagro, Palermo, Recoleta"
                  required
                />
              </div>

              <div>
                <Label className="text-foreground">Tipo de Propiedad *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleChange("propertyType", value)}
                >
                  <SelectTrigger className="mt-1 bg-background/50">
                    <SelectValue placeholder="Seleccioná una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">Cantidad de Ambientes? *</Label>
                <Select
                  value={formData.roomsCount}
                  onValueChange={(value) => handleChange("roomsCount", value)}
                >
                  <SelectTrigger className="mt-1 bg-background/50">
                    <SelectValue placeholder="Seleccioná una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomsCountOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hasExpenses" className="text-foreground">
                  ¿Paga expensas? (opcional)
                </Label>
                <Input
                  id="hasExpenses"
                  type="text"
                  value={formData.hasExpenses}
                  onChange={(e) => handleChange("hasExpenses", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: Sí, $50.000 mensuales"
                />
              </div>

              <div>
                <Label htmlFor="propertySize" className="text-foreground">
                  Tamaño - ¿cuántos m² tiene? (opcional)
                </Label>
                <Input
                  id="propertySize"
                  type="text"
                  value={formData.propertySize}
                  onChange={(e) => handleChange("propertySize", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: 75 m²"
                />
              </div>

              <div>
                <Label htmlFor="expectedPrice" className="text-foreground">
                  Precio pretendido (opcional)
                </Label>
                <Input
                  id="expectedPrice"
                  type="text"
                  value={formData.expectedPrice}
                  onChange={(e) => handleChange("expectedPrice", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Ej: USD 120.000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si tenés un precio en mente, compartilo. Sino, lo evaluamos nosotros.
                </p>
              </div>

              <div>
                <Label htmlFor="info" className="text-foreground">
                  ¿Algo más que debamos saber?
                </Label>
                <Textarea
                  id="info"
                  value={formData.additionalInfo}
                  onChange={(e) => handleChange("additionalInfo", e.target.value)}
                  className="mt-1 bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="Cuéntanos brevemente tu situación..."
                  rows={3}
                />
              </div>

              <div
                className={`rounded-lg border-2 p-4 transition-colors ${
                  formData.whatsappConsent === "si"
                    ? "border-primary bg-primary/10"
                    : "border-accent/60 bg-accent/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="whatsapp-consent"
                    checked={formData.whatsappConsent === "si"}
                    onCheckedChange={(checked) =>
                      handleChange("whatsappConsent", checked ? "si" : "")
                    }
                    className="mt-0.5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor="whatsapp-consent"
                    className="cursor-pointer text-sm font-normal leading-relaxed text-foreground"
                  >
                    Acepto que <strong>CIRE</strong> me contacte por WhatsApp sobre mi consulta. *
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Te escribimos al número que indicaste, solo para analizar tu caso. Podés pedir
                      que no te contactemos más cuando quieras.
                    </span>
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 py-6 border-border text-foreground hover:bg-secondary"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex-1 gradient-cta text-primary-foreground font-semibold py-6 shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? "Enviando..." : "Enviar consulta"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Tus datos se usan solo para analizar tu caso. No los compartimos con terceros.{" "}
              <a
                href="/politica-de-privacidad"
                className="text-primary underline underline-offset-2"
              >
                Política de privacidad
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LeadForm;
