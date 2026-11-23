import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Pagan menos que el precio de mercado?",
    answer: "Sí. Compramos con descuento porque asumimos el riesgo, los problemas legales, la obra y la gestión que vos no querés o no podés hacer. No prometemos el precio máximo: prometemos una salida rápida, segura y sin vueltas. Si buscás precio de mercado y podés esperar, una inmobiliaria tradicional es mejor opción.",
  },
  {
    question: "¿Cuánto tarda?",
    answer: "Oferta concreta por escrito en 48 horas. Una vez que aceptás la oferta, y con la documentación en regla, el cierre es en 90 días o menos, garantizado.",
  },
  {
    question: "¿Qué me van a preguntar en la llamada?",
    answer: "Unas preguntas de descubrimiento para entender tu caso: cómo está la propiedad, qué documentación tenés, si hay deudas u ocupantes y cuáles son tus tiempos. No hace falta que tengas todo resuelto: para eso es la llamada.",
  },
  {
    question: "¿Qué tipo de propiedades compran?",
    answer: "Propiedades en CABA con problemas reales: herencias sin resolver, deterioro, conflictos familiares, ocupantes, deudas acumuladas, usufructos o inversiones que no funcionaron. No compramos propiedades en perfecto estado ni fuera de CABA.",
  },
  {
    question: "¿Cobran comisión?",
    answer: "No. Somos compradores directos, no intermediarios, así que no hay comisión inmobiliaria. Los gastos de escritura que le corresponden a cada parte se detallan en la oferta.",
  },
  {
    question: "¿Qué pasa si la propiedad tiene deudas?",
    answer: "Analizamos cada caso. Podemos comprar propiedades con deudas de expensas, servicios o impuestos, y armar la operación para resolverlas. No compramos propiedades con embargo judicial activo.",
  },
  {
    question: "¿Tengo que hacer arreglos antes de vender?",
    answer: "No. Compramos como está. No te pedimos que pintes, arregles humedades ni pongas la instalación al día.",
  },
  {
    question: "¿Compran si hay varios herederos que no se ponen de acuerdo?",
    answer: "Podemos trabajar en casos con conflicto entre herederos. La forma de hacerlo depende de cada sucesión: lo vemos en la llamada con el respaldo de nuestros abogados.",
  },
  {
    question: "¿En qué barrios compran?",
    answer: "En la mayoría de los barrios de CABA, pero no en todos. Completá el formulario y en 48 horas te confirmamos si tu zona aplica.",
  },
];

const FAQSection = () => {
  return (
    <section className="bg-background-dark py-20 md:py-28">
      <div className="container grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-8">
          <p className="etiqueta text-primary">Preguntas frecuentes</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">Sin vueltas</h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Si tu pregunta no está acá, escribila en el formulario y la respondemos en la llamada.
          </p>
        </div>

        <Accordion type="single" collapsible className="border-t border-border">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left text-lg font-bold text-foreground hover:text-primary hover:no-underline transition-colors py-5 [&[data-state=open]>svg]:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
