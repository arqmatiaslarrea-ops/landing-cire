import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
);

export type Unidad = "ranka" | "ranka_by_cire" | "inmobiliaria" | "desarrolladora";
export type Perfil = "vendedor_motivado" | "inmobiliaria" | "inversor";

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
