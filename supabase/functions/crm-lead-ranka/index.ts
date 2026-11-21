// Recibe los leads del formulario de rankaagency.com (Club +MIL) y los da de alta en el CRM:
// ficha de la persona, inmobiliaria como empresa, perfil "inmobiliaria" y oportunidad en Ranka by CIRE.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const ORIGENES = ["https://rankaagency.com", "https://www.rankaagency.com"];
const corta = (v: unknown, n = 300) => (v == null ? null : String(v).slice(0, n).trim() || null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const origen = req.headers.get("origin") || "";
  if (origen && !ORIGENES.includes(origen) && !origen.endsWith(".vercel.app")) return new Response("no", { status: 403, headers: CORS });
  let d: Record<string, any>;
  try { d = JSON.parse(await req.text()); } catch { return new Response("bad", { status: 400, headers: CORS }); }
  if (d.tipo === "accion") {
    const { data: a } = await sb.from("crm_activities").select("contact_id").eq("tipo", "formulario_web").filter("detalle->>lead_id", "eq", corta(d.lead_id, 40)).maybeSingle();
    if (a) await sb.from("crm_activities").insert({ contact_id: a.contact_id, unidad: "ranka_by_cire", tipo: "whatsapp", detalle: { resultado: `El lead abrió ${corta(d.canal, 30)} desde la web` } });
    return new Response("ok", { headers: CORS });
  }
  const nombre = [corta(d.nombre, 80), corta(d.apellido, 80)].filter(Boolean).join(" ");
  if (!nombre || (!d.whatsapp && !d.email)) return new Response("faltan datos", { status: 400, headers: CORS });

  const { data: cid, error } = await sb.rpc("crm_upsert_contact", { p_nombre: nombre, p_email: corta(d.email, 120), p_tel: corta(d.whatsapp, 40) });
  if (error || !cid) return new Response("error", { status: 500, headers: CORS });

  let orgId: string | null = null;
  const empresa = corta(d.inmobiliaria, 120);
  if (empresa) {
    const { data: o } = await sb.from("crm_organizaciones").select("id").ilike("nombre", empresa).limit(1).maybeSingle();
    orgId = o?.id || (await sb.from("crm_organizaciones").insert({ nombre: empresa, fuente: "rankaagency.com", estado_contacto: "respondio", cartera_aprox: Number(String(d.cartera || "").replace(/\D/g, "")) || null }).select("id").single()).data?.id || null;
    await sb.from("crm_contacts").update({ organizacion_id: orgId, empresa }).eq("id", cid).is("organizacion_id", null);
  }
  const datos = Object.fromEntries(["rol", "cartera", "captaciones_3m", "estancadas", "inversion", "portales_usd", "propiedades_pauta", "dolores", "dolor_principal", "urgencia", "simulador", "califica", "puntaje", "prioridad", "utm_source", "utm_campaign"].map((k) => [k, corta(d[k])]).filter(([, v]) => v != null));
  await sb.from("crm_contact_profiles").upsert({ contact_id: cid, perfil: "inmobiliaria", datos, updated_at: new Date().toISOString() }, { onConflict: "contact_id,perfil" });
  const { data: rel } = await sb.from("crm_relations").select("id").eq("contact_id", cid).eq("embudo", "inmobiliarias").maybeSingle();
  if (!rel) {
    await sb.from("crm_relations").insert({ contact_id: cid, unidad: "ranka_by_cire", embudo: "inmobiliarias", etapa: "nuevo", responsable: "mati", origen: `rankaagency.com${d.utm_source ? ` (${corta(d.utm_source, 40)})` : ""}`, estado: d.califica === "No" ? "descartado" : "prospecto" });
  } else {
    await sb.from("crm_tareas").insert({ contact_id: cid, relation_id: rel.id, unidad: "ranka_by_cire", tipo: "llamar", titulo: "Volvió a completar el formulario de Ranka: llamar ya", vence: new Date().toISOString(), responsable: "mati", prioridad: "alta", origen: "automatizacion" });
  }
  await sb.from("crm_activities").insert({ contact_id: cid, unidad: "ranka_by_cire", tipo: "formulario_web", detalle: { landing: "rankaagency.com", lead_id: corta(d.lead_id, 40), prioridad: corta(d.prioridad, 5), puntaje: corta(d.puntaje, 5), califica: corta(d.califica, 5) } });
  return new Response("ok", { headers: CORS });
});
