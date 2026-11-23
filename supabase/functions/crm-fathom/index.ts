// Webhook de Fathom: cuando una grabación está lista, adjunta el resumen a la ficha del contacto y a su reunión.
// URL a cargar en Fathom: .../functions/v1/crm-fathom?t=<token>. El formato del payload se lee de forma tolerante.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// Dueño del calendario: la dirección iCal secreta de Google lleva el id del calendario (/ical/<id>/private-…)
const duenoCal = (url: string) => { try { const m = String(url || "").match(/\/ical\/([^/]+)\//); return m ? decodeURIComponent(m[1]).toLowerCase() : ""; } catch { return ""; } };
let EQUIPO: string[] = []; // mails del equipo: crm_usuarios + secreto CRM_MAILS_INTERNOS
async function cargarEquipo() {
  const { data } = await sb.from("crm_usuarios").select("email");
  const { data: cals } = await sb.from("crm_calendarios").select("ics_url");
  const { data: internos } = await sb.from("crm_mails_internos").select("email");
  const extra = [...(Deno.env.get("CRM_MAILS_INTERNOS") || "").split(","), ...(cals || []).map((c: any) => duenoCal(c.ics_url)), ...(internos || []).map((i: any) => String(i.email))];
  EQUIPO = [...new Set([...(data || []).map((u: any) => String(u.email || "")), ...extra].map((x) => x.trim().toLowerCase()).filter(Boolean))];
}

function buscar(o: any, f: (k: string, v: any) => boolean, out: any[] = []): any[] {
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (f(k, v)) out.push(v); buscar(v, f, out); }
  return out;
}

Deno.serve(async (req) => {
  const { data: token } = await sb.rpc("crm_secreto", { p_nombre: "fathom_token" });
  if (!token || new URL(req.url).searchParams.get("t") !== token) return new Response("no", { status: 401 });
  const p = await req.json().catch(() => ({}));
  await cargarEquipo();
  const emails = [...new Set(buscar(p, (_k, v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).map((v: string) => v.toLowerCase()))].filter((e) => !EQUIPO.includes(e));
  const url = buscar(p, (k, v) => typeof v === "string" && /share_url|url/.test(k) && v.includes("fathom"))[0] || null;
  const resumen = buscar(p, (k, v) => typeof v === "string" && /summary|markdown/.test(k) && v.length > 40)[0] || null;
  const titulo = buscar(p, (k, v) => typeof v === "string" && /title/.test(k))[0] || "Reunión";
  const items = buscar(p, (k, v) => Array.isArray(v) && /action_items/.test(k))[0] || [];
  let n = 0;
  for (const email of emails) {
    const { data: c } = await sb.from("crm_contacts").select("id").ilike("email", email).maybeSingle();
    if (!c) continue;
    n++;
    const { data: m } = await sb.from("crm_reuniones").select("id,unidad").eq("contact_id", c.id).order("inicio", { ascending: false }).limit(1).maybeSingle();
    if (m) await sb.from("crm_reuniones").update({ estado: "realizada", fathom_url: url, resumen: resumen?.slice(0, 8000) || null }).eq("id", m.id);
    await sb.from("crm_activities").insert({ contact_id: c.id, unidad: m?.unidad || null, tipo: "reunion", autor: "fathom", detalle: { resultado: "Reunión grabada en Fathom", titulo, url, texto: resumen?.slice(0, 1500), tareas: items.slice?.(0, 10) } });
  }
  return new Response(JSON.stringify({ ok: true, contactos: n }), { headers: { "Content-Type": "application/json" } });
});
