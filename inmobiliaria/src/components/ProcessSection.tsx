import { MessageSquare, Search, FileText, Handshake } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Contanos tu situación",
    description: "Completá el formulario con los datos básicos de tu propiedad y el problema que enfrentás. Sin compromiso.",
    time: "5 minutos",
  },
  {
    number: "02",
    icon: Search,
    title: "Analizamos tu caso",
    description: "Estudiamos la viabilidad legal, técnica y financiera. Si no podemos ayudarte, te lo decimos rápido y claro.",
    time: "48 horas",
  },
  {
    number: "03",
    icon: FileText,
    title: "Recibís una oferta concreta",
    description: "Si tu caso encaja, te presentamos una propuesta real con precio, condiciones y cronograma de cierre.",
    time: "1 semana",
  },
  {
    number: "04",
    icon: Handshake,
    title: "Cerramos la operación",
    description: "Nos ocupamos de la documentación, estructuramos la compra según tu caso y escrituramos. Sin sorpresas.",
    time: "45 días",
  },
];

const ProcessSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background-darker">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Proceso simple
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3 mb-4">
            Así trabajamos
          </h2>
          <p className="text-lg text-muted-foreground">
            Sin idas y vueltas. Sin visitas masivas. Sin meses de espera.
            Un proceso diseñado para resolver, no para entretener.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="gradient-card rounded-2xl p-6 shadow-card border border-border/30 h-full relative z-10">
                {/* Number badge */}
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-button">
                  <span className="font-display font-bold text-primary-foreground">{step.number}</span>
                </div>

                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-display font-bold text-foreground pr-8">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  
                  <div className="pt-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {step.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
