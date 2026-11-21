import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
);

export type Unidad = "ranka" | "ranka_by_cire" | "inmobiliaria" | "desarrolladora";
export type Perfil = "vendedor_motivado" | "inmobiliaria" | "inversor" | "comprador";

export const UNIDADES: Record<Unidad, string> = {
  ranka: "Ranka Agency",
  ranka_by_cire: "Ranka by CIRE",
  inmobiliaria: "Inmobiliaria CIRE",
  desarrolladora: "Desarrolladora CIRE",
};

export const PERFILES: Record<Perfil, string> = {
  vendedor_motivado: "Vendedor motivado",
  inmobiliaria: "Inmobiliaria",
  inversor: "Inversor",
  comprador: "Comprador",
};

export type Embudo = { id: string; unidad: Unidad; nombre: string; etapas: { id: string; nombre: string; cierre?: boolean }[] };

export const EMBUDOS: Embudo[] = [
  {
    id: "vendedores_motivados", unidad: "inmobiliaria", nombre: "Vendedores motivados",
    etapas: [
      { id: "nuevo", nombre: "Nuevo" },
      { id: "contactado", nombre: "Contactado" },
      { id: "descubrimiento", nombre: "Descubrimiento" },
      { id: "calificado", nombre: "Motivación detectada → Mati" },
      { id: "visita", nombre: "Visita" },
      { id: "oferta_enviada", nombre: "Oferta enviada" },
      { id: "negociacion", nombre: "Negociación" },
      { id: "reserva", nombre: "Reserva / contrato" },
      { id: "cerrado", nombre: "Cerrado", cierre: true },
      { id: "derivado_inmobiliaria", nombre: "Derivado a inmobiliaria", cierre: true },
      { id: "derivado_abogado", nombre: "Derivado a abogado", cierre: true },
      { id: "descartado", nombre: "Descartado", cierre: true },
    ],
  },
  {
    id: "compradores", unidad: "inmobiliaria", nombre: "Compradores (campañas)",
    etapas: [
      { id: "nuevo", nombre: "Nuevo" },
      { id: "contactado", nombre: "Contactado" },
      { id: "calificado", nombre: "Calificado" },
      { id: "visita_agendada", nombre: "Visita agendada" },
      { id: "visito", nombre: "Visitó" },
      { id: "oferta", nombre: "Oferta" },
      { id: "reserva", nombre: "Reserva" },
      { id: "cerrado", nombre: "Compró", cierre: true },
      { id: "descartado", nombre: "Descartado", cierre: true },
    ],
  },
  {
    id: "inversores", unidad: "desarrolladora", nombre: "Inversores",
    etapas: [
      { id: "nuevo", nombre: "Nuevo" },
      { id: "contactado", nombre: "Contactado" },
      { id: "reunion", nombre: "Reunión" },
      { id: "interesado", nombre: "Interesado en proyecto" },
      { id: "comprometido", nombre: "Comprometido" },
      { id: "invirtio", nombre: "Invirtió", cierre: true },
      { id: "descartado", nombre: "Descartado", cierre: true },
    ],
  },
  {
    id: "inmobiliarias", unidad: "ranka_by_cire", nombre: "Inmobiliarias (Club +MIL)",
    etapas: [
      { id: "nuevo", nombre: "Nuevo" },
      { id: "contactado", nombre: "Contactado" },
      { id: "llamada_agendada", nombre: "Llamada agendada" },
      { id: "asistio", nombre: "Asistió" },
      { id: "propuesta", nombre: "Propuesta" },
      { id: "cliente", nombre: "Cliente", cierre: true },
      { id: "perdido", nombre: "Perdido", cierre: true },
    ],
  },
  {
    id: "clientes_ranka", unidad: "ranka", nombre: "Clientes Ranka",
    etapas: [
      { id: "nuevo", nombre: "Nuevo" },
      { id: "contactado", nombre: "Contactado" },
      { id: "llamada_agendada", nombre: "Llamada agendada" },
      { id: "asistio", nombre: "Asistió" },
      { id: "propuesta", nombre: "Propuesta" },
      { id: "cliente", nombre: "Cliente", cierre: true },
      { id: "perdido", nombre: "Perdido", cierre: true },
    ],
  },
];

export const LOACC = [
  { id: "L", nombre: "Lead" },
  { id: "O", nombre: "Oferta" },
  { id: "A", nombre: "Visita" },
  { id: "C1", nombre: "Contrato" },
  { id: "C2", nombre: "Cierre" },
];

export const ESTADOS_OFERTA = ["borrador", "enviada", "sin_respuesta", "negociando", "contraoferta", "aceptada", "rechazada", "vencida", "cerrada"];

export const etiqueta = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const usd = (n: number | null | undefined) => (n == null ? "—" : "USD " + Number(n).toLocaleString("es-AR"));
export const fecha = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("es-AR") : "—");
export const waLink = (tel: string | null, texto = "") => {
  if (!tel) return null;
  let d = tel.replace(/\D/g, "");
  if (d.length === 10) d = "549" + d;
  else if (d.startsWith("54") && !d.startsWith("549")) d = "549" + d.slice(2);
  return `https://wa.me/${d}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
};

// Motivos de descarte: se guardan en el historial y alimentan el aprendizaje de campañas y embudos
export const MOTIVOS_DESCARTE = [
  "No responde (3 intentos)", "No le interesa", "Sin capital o financiación", "Busca otra zona o tipo",
  "Precio fuera de rango", "Ya compró o vendió", "Dato falso o duplicado", "Problema legal sin solución", "Otro",
];

// Próximo hito sugerido por etapa: qué hacer ahora para llevar el lead a la etapa siguiente
export const PROXIMO_HITO: Record<string, Record<string, string>> = {
  vendedores_motivados: {
    nuevo: "Primer contacto en menos de 5 minutos: WhatsApp y llamada",
    contactado: "Hacer el guion de descubrimiento y poner semáforo",
    descubrimiento: "Cerrar el semáforo: verde pasa a Mati, amarillo a seguimiento",
    calificado: "Coordinar visita y calcular la oferta máxima (menos de 48 h)",
    visita: "Cargar ARV, obra y gastos; generar la oferta",
    oferta_enviada: "Seguimiento a las 24 h: ¿qué le pareció el número?",
    negociacion: "Definir contraoferta dentro de la oferta máxima",
    reserva: "Escribano, documentación y difusión a inversores",
  },
  compradores: {
    nuevo: "WhatsApp con fotos y video del inmueble, en menos de 5 minutos",
    contactado: "Calificar: forma de pago, plazo y quién decide",
    calificado: "Agendar visita esta semana",
    visita_agendada: "Confirmar la visita el día anterior",
    visito: "Pedir devolución a las 24 h y proponer oferta",
    oferta: "Negociar con el vendedor y responder en 48 h",
    reserva: "Coordinar escribano y documentación",
  },
  inversores: {
    nuevo: "Llamada de 15 minutos para entender capital, plazo y perfil",
    contactado: "Agendar reunión y presentar el proyecto que encaja",
    reunion: "Mandar la ficha del proyecto con escenario proyectado (sujeto a validación)",
    interesado: "Definir esquema (participación o préstamo) y monto",
    comprometido: "Firma y desembolso: validar con profesional matriculado",
  },
  inmobiliarias: {
    nuevo: "Llamar y agendar la llamada de diagnóstico",
    contactado: "Agendar la llamada de diagnóstico",
    llamada_agendada: "Confirmar asistencia el día anterior",
    asistio: "Mandar la propuesta en 24 h",
    propuesta: "Seguimiento a las 48 h y cierre",
  },
  clientes_ranka: {
    nuevo: "Llamar y agendar la llamada de diagnóstico",
    contactado: "Agendar la llamada de diagnóstico",
    llamada_agendada: "Confirmar asistencia el día anterior",
    asistio: "Mandar la propuesta en 24 h",
    propuesta: "Seguimiento a las 48 h y cierre",
  },
};
