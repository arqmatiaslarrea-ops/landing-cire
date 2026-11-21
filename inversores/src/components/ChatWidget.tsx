import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatWidgetProps {
  onOpenForm: () => void;
}

type ChatStep = "initial" | "investing" | "exploring" | "redirect";

const chatFlows = {
  initial: {
    message: "¡Hola! ¿Estás evaluando invertir en proyectos inmobiliarios o solo explorando opciones?",
    options: [
      { label: "Estoy evaluando invertir", next: "investing" as ChatStep },
      { label: "Solo explorando", next: "exploring" as ChatStep },
    ],
  },
  investing: {
    message: "Perfecto. CIRE opera proyectos Fix & Flip con ciclos de 6-12 meses. ¿Te gustaría saber si hay encaje con tu perfil de inversión?",
    options: [
      { label: "Sí, quiero evaluar", next: "redirect" as ChatStep },
      { label: "Primero quiero saber más", next: "exploring" as ChatStep },
    ],
  },
  exploring: {
    message: "Entendido. Te recomiendo revisar nuestra sección de método para entender cómo operamos. Cuando estés listo, puedes completar el formulario de evaluación.",
    options: [
      { label: "Ver el método", action: "scrollToMethod" },
      { label: "Completar formulario", next: "redirect" as ChatStep },
    ],
  },
  redirect: {
    message: "Excelente. Completa el formulario y te contactaremos para una conversación sin compromiso.",
    options: [{ label: "Ir al formulario", action: "openForm" }],
  },
};

export const ChatWidget = ({ onOpenForm }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("cire_chat_opened") === "1"
  );
  const [currentStep, setCurrentStep] = useState<ChatStep>("initial");
  const [messages, setMessages] = useState<
    Array<{ type: "bot" | "user"; text: string }>
  >([{ type: "bot", text: chatFlows.initial.message }]);

  const handleOption = (option: {
    label: string;
    next?: ChatStep;
    action?: string;
  }) => {
    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: option.label }]);

    if (option.action === "scrollToMethod") {
      document.getElementById("method")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setIsOpen(false), 500);
      return;
    }

    if (option.action === "openForm") {
      onOpenForm();
      setIsOpen(false);
      return;
    }

    if (option.next) {
      setTimeout(() => {
        setCurrentStep(option.next!);
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: chatFlows[option.next!].message },
        ]);
      }, 500);
    }
  };

  const resetChat = () => {
    setCurrentStep("initial");
    setMessages([{ type: "bot", text: chatFlows.initial.message }]);
  };

  return (
    <>
      {/* Chat button - hidden on mobile where sticky CTA bar is shown */}
      <button
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat con un asesor"}
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            resetChat();
            setHasOpened(true);
            localStorage.setItem("cire_chat_opened", "1");
          }
        }}
        className="fixed bottom-6 right-6 z-50 hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-cta-gradient shadow-glow hover:scale-105 active:scale-95 transition-transform"
      >
        {/* Badge de invitación: desaparece al primer click */}
        {!hasOpened && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background" />
          </span>
        )}
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-large border border-border overflow-hidden animate-slide-in-right">
          {/* Header */}
          <div className="p-4 bg-hero-gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="font-display text-sm font-bold text-white">C</span>
              </div>
              <div>
                <p className="font-semibold text-white">CIRE</p>
                <p className="text-xs text-white/60">Respuesta inmediata</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 h-64 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.type === "user"
                      ? "bg-cire-orange text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="p-4 border-t border-border space-y-2">
            {chatFlows[currentStep].options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleOption(option)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
