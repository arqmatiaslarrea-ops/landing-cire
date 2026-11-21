import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Pagan menos que el precio de mercado?",
    answer: "Sí, compramos con descuento porque asumimos el riesgo, los problemas legales, la obra y la gestión que vos no querés o no podés hacer. No prometemos el precio máximo; prometemos una salida rápida, segura y sin vueltas. Si buscás precio de mercado y podés esperar, una inmobiliaria tradicional es mejor opción.",
  },
  {
    question: "¿Qué tipo de propiedades compran?",
    answer: "Propiedades en Capital Federal con problemas reales: herencias sin resolver, deterioro estructural, conflictos familiares, ocupantes, deudas acumuladas, usufructos, o inversiones que no funcionaron. No compramos propiedades en perfecto estado ni fuera de CABA.",
  },
  {
    question: "¿Cuánto tarda el proceso completo?",
    answer: "Desde que completás el formulario hasta que tenés dinero en tu cuenta: entre 45 y 60 días en casos estándar. En 48 horas te decimos si tu caso nos interesa. En una semana tenés una oferta concreta si aplica.",
  },
  {
    question: "¿Cobran comisión inmobiliaria?",
    answer: "No. Somos compradores directos, no intermediarios. No hay comisión inmobiliaria ni costos ocultos. El precio que acordamos es el que recibís.",
  },
  {
    question: "¿Qué pasa si mi propiedad tiene deudas?",
    answer: "Analizamos cada caso. Podemos comprar propiedades con deudas de expensas, servicios o impuestos, estructurando la operación para resolver esos temas. No compramos propiedades con embargos judiciales activos.",
  },
  {
    question: "¿Necesito hacer reparaciones antes de vender?",
    answer: "No. Compramos 'como está'. No te pedimos que pintes, arregles humedades, ni pongas la instalación eléctrica al día. Eso es problema nuestro, no tuyo.",
  },
  {
    question: "¿Compran si hay varios herederos en desacuerdo?",
    answer: "Podemos trabajar en casos donde hay conflicto entre herederos, siempre que la mayoría esté de acuerdo en vender. Estructuramos la operación para que cada parte reciba su porción sin que tengan que ponerse de acuerdo en todo.",
  },
  {
    question: "¿Qué zonas de Capital Federal aceptan?",
    answer: "Trabajamos en la mayoría de los barrios de CABA, pero no en todos. Barrios con muy bajo potencial de reventa pueden quedar fuera. Completá el formulario y te confirmamos en 48 horas si tu zona aplica.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 md:py-28 gradient-background">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Preguntas frecuentes
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3 mb-4">
            Lo que probablemente te estés preguntando
          </h2>
          <p className="text-lg text-muted-foreground">
            Respondemos sin vueltas. Si tu pregunta no está acá, consultanos 
            directamente en el formulario.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="gradient-card rounded-xl border border-border/30 px-6 shadow-card data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary transition-colors py-5 [&[data-state=open]>svg]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
