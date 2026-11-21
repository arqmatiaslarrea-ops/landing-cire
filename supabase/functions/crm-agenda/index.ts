// Recibe las reservas de la agenda de Google (las manda un Apps Script desde la cuenta de Mati cada 10 minutos)
// y las vuelca al CRM: ficha del contacto, oportunidad en "llamada agendada" y reunión con recordatorios.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const EQUIPO = ["arqmatiaslarrea@gmail.com", "larrea869@gmail.com", "ranka.agencia@gmail.com", "sofi.abril.alberto@gmail.com", "ms.kasianczuk@gmail.com"];

type Evento = { id: string; inicio: string; fin?: string; titulo?: string; descripcion?: string; link?: string; invitados: { email: string; nombre?: string }[]; cancelado?: boolean };

Deno.serve(async (req) => {
  const { data: token } = await sb.rpc("crm_secreto", { p_nombre: "agenda_token" });
  if (!token || req.headers.get("x-agenda-token") !== token) return new Response("no", { status: 401 });
  const { eventos } = (await req.json()) as { eventos: Evento[] };
  const res: any[] = [];
  for (const ev of eventos || []) {
    const externo = (ev.invitados || []).find((i) => i.email && !EQUIPO.includes(i.email.toLowerCase()));
    if (!externo) { res.push({ id: ev.id, omitido: "sin invitado externo" }); continue; }
    const email = externo.email.toLowerCase();
    let { data: c } = await sb.from("crm_contacts").select("id,nombre").ilike("email", email).maybeSingle();
    if (!c) {
      const nombre = externo.nombre || email.split("@")[0];
      const ins = await sb.from("crm_contacts").insert({ nombre, email }).select("id,nombre").single();
      c = ins.data;
    }
    if (!c) continue;
    const texto = `${ev.titulo || ""} ${ev.descripcion || ""}`.toLowerCase();
    const unidad = /inversi|invertir|fix/.test(texto) ? "desarrolladora" : /vend|propiedad|tasaci/.test(texto) && !/inmobiliaria|club|aviso/.test(texto) ? "inmobiliaria" : "ranka_by_cire";
    const embudo = unidad === "desarrolladora" ? "inversores" : unidad === "inmobiliaria" ? "vendedores_motivados" : "inmobiliarias";
    const perfil = unidad === "desarrolladora" ? "inversor" : unidad === "inmobiliaria" ? "vendedor_motivado" : "inmobiliaria";
    await sb.from("crm_contact_profiles").upsert({ contact_id: c.id, perfil }, { onConflict: "contact_id,perfil", ignoreDuplicates: true });
    const { data: rel } = await sb.from("crm_relations").select("id,etapa").eq("contact_id", c.id).eq("embudo", embudo).maybeSingle();
    if (!rel) await sb.from("crm_relations").insert({ contact_id: c.id, unidad, embudo, etapa: embudo === "inmobiliarias" ? "llamada_agendada" : "contactado", responsable: "mati", origen: "agenda de Google" });
    else if (["nuevo", "contactado"].includes(rel.etapa) && embudo === "inmobiliarias") await sb.from("crm_relations").update({ etapa: "llamada_agendada" }).eq("id", rel.id);
    const fila = { contact_id: c.id, unidad, inicio: ev.inicio, fin: ev.fin || null, titulo: ev.titulo || null, link_reunion: ev.link || null, origen: "google_calendar", google_event_id: ev.id, updated_at: new Date().toISOString() };
    const { data: previa } = await sb.from("crm_reuniones").select("id,inicio,estado").eq("google_event_id", ev.id).maybeSingle();
    if (ev.cancelado) { if (previa) await sb.from("crm_reuniones").update({ estado: "cancelada" }).eq("id", previa.id); res.push({ id: ev.id, cancelada: true }); continue; }
    if (!previa) {
      await sb.from("crm_reuniones").insert(fila);
      await sb.from("crm_activities").insert({ contact_id: c.id, unidad, tipo: "reunion_agendada", detalle: { inicio: ev.inicio, titulo: ev.titulo } });
    } else if (new Date(previa.inicio).getTime() !== new Date(ev.inicio).getTime()) {
      await sb.from("crm_reuniones").update({ ...fila, estado: "agendada", recordatorio_24h_at: null, recordatorio_1h_at: null }).eq("id", previa.id);
    }
    res.push({ id: ev.id, contacto: c.nombre, unidad });
  }
  return new Response(JSON.stringify({ procesados: res.length, res }), { headers: { "Content-Type": "application/json" } });
});
