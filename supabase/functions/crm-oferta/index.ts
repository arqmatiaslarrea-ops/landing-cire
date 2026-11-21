// Genera la oferta de compra desde la plantilla de Drive (vía el Apps Script de Mati) y la registra en el CRM.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const URL_SB = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const U = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
function cientos(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100), r = n % 100;
  const dec = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " y " + U[r % 10] : "");
  return [C[c], dec].filter(Boolean).join(" ");
}
function letras(n: number): string {
  n = Math.round(n);
  if (n === 0) return "cero";
  const mill = Math.floor(n / 1e6), miles = Math.floor((n % 1e6) / 1000), resto = n % 1000;
  const p: string[] = [];
  if (mill) p.push(mill === 1 ? "un millón" : cientos(mill).replace(/uno$/, "un") + " millones");
  if (miles) p.push(miles === 1 ? "mil" : cientos(miles).replace(/uno$/, "un") + " mil");
  if (resto) p.push(cientos(resto));
  return p.join(" ");
}
const num = (n: number) => Math.round(n).toLocaleString("es-AR");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const usr = createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: yo } = await usr.rpc("crm_yo");
  if (!yo?.email || !(yo.admin || (yo.unidades || []).some((u: string) => ["inmobiliaria", "desarrolladora"].includes(u)))) return json({ error: "Sin permiso para generar ofertas" }, 403);
  const b = await req.json();
  const { data: p } = await admin.from("crm_propiedades").select("id,direccion,barrio,localidad,vendedor_contact_id").eq("id", b.propiedad_id).single();
  if (!p) return json({ error: "Propiedad no encontrada" }, 404);
  const monto = Number(b.monto_usd), reserva = Number(b.reserva_usd || 0);
  if (!(monto > 0)) return json({ error: "Falta el monto" }, 400);
  const fecha = b.fecha || new Date().toISOString().slice(0, 10);
  const campos: Record<string, string> = {
    FECHA: new Date(fecha + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
    DIRECCION: p.direccion, BARRIO: p.barrio || "", LOCALIDAD: p.localidad || "CABA",
    MONTO_NUM: num(monto), MONTO_LETRAS: letras(monto),
    RESERVA_NUM: num(reserva), RESERVA_LETRAS: letras(reserva),
    DIAS_CONTINGENCIA: String(b.dias_contingencia ?? 10), PLAZO_ESCRITURA: String(b.plazo_escritura ?? 30),
    VALIDEZ: String(b.validez ?? 3), ESCRIBANO: b.escribano || "a designar por la parte compradora",
    CLAUSULA_HONORARIOS: b.clausula_honorarios || "Los honorarios inmobiliarios quedan a cargo de cada parte según los usos y costumbres de plaza.",
  };
  const [{ data: url }, { data: tok }] = await Promise.all([admin.rpc("crm_secreto", { p_nombre: "oferta_script_url" }), admin.rpc("crm_secreto", { p_nombre: "agenda_token" })]);
  if (!url) return json({ error: "Falta conectar el script de Google (paso de instalación pendiente)" }, 503);
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "oferta", token: tok, titulo: `Oferta ${p.direccion} - USD ${num(monto)} - ${fecha}`, campos }), redirect: "follow" });
  const res = await r.json().catch(() => null);
  if (!res?.url) return json({ error: "Google no devolvió el documento", detalle: res }, 502);
  const { data: of, error } = await admin.from("crm_ofertas").insert({
    fecha, direccion: p.direccion, barrio: p.barrio, localidad: p.localidad || "CABA", monto_usd: monto, reserva_usd: reserva || null,
    validez_dias_habiles: Number(campos.VALIDEZ), estado: "borrador", etapa_loacc: "O", contact_id: p.vendedor_contact_id, propiedad_id: p.id,
    responsable: yo.clave, doc_url: res.url, drive_file_id: res.id,
  }).select("id").single();
  if (error) return json({ error: error.message, url: res.url }, 500);
  return json({ ok: true, url: res.url, oferta_id: of.id });
});
