// Recibe las reservas de la agenda de Google (crm-calendario cada 10 minutos o el Apps Script)
// y las vuelca al CRM: ficha del contacto, oportunidad, reunión con recordatorios y tarea de preparación.
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

type Evento = { id: string; inicio: string; fin?: string; titulo?: string; descripcion?: string; link?: string; invitados: { email: string; nombre?: string }[]; cancelado?: boolean };

Deno.serve(async (req) => {
  const { data: token } = await sb.rpc("crm_secreto", { p_nombre: "agenda_token" });
  if (!token || req.headers.get("x-agenda-token") !== token) return new Response("no", { status: 401 });
  const { eventos } = (await req.json()) as { eventos: Evento[] };
  await cargarEquipo();
  const res: any[] = [];
  for (const ev of eventos || []) {
    // Las reservas hechas desde la agenda propia de las landings ya están en el CRM
    if (String(ev.id).startsWith("reserva-")) { res.push({ id: ev.id, omitido: "reserva propia" }); continue; }
    const externo = (ev.invitados || []).find((i) => i.email && !EQUIPO.includes(i.email.toLowerCase()));
    if (!externo) { res.push({ id: ev.id, omitido: "sin invitado externo" }); continue; }
    const email = externo.email.toLowerCase();
    let { data: c } = await sb.from("crm_contacts").select("id,nombre").eq("email", email).limit(1).maybeSingle();
    if (!c) c = (await sb.from("crm_contacts").select("id,nombre").ilike("email", email.replace(/[\\%_]/g, "\\$&")).limit(1).maybeSingle()).data;
    if (!c) {
      const nombre = externo.nombre || email.split("@")[0];
      const ins = await sb.from("crm_contacts").insert({ nombre, email }).select("id,nombre").single();
      c = ins.data;
    }
    if (!c) continue;
    // 1) Si la persona ya está en un embudo abierto, la reunión es de esa oportunidad (no se adivina por el título).
    const { data: abiertas } = await sb.from("crm_relations").select("id,unidad,embudo,etapa,responsable")
      .eq("contact_id", c.id).not("estado", "in", "(descartado,ex_cliente)").order("updated_at", { ascending: false }).limit(1);
    let rel = abiertas?.[0] || null;
    let unidad: string, embudo: string;
    if (rel) { unidad = rel.unidad; embudo = rel.embudo; }
    else {
      // 2) Persona nueva: se infiere por el título o la descripción de la reserva.
      const texto = `${ev.titulo || ""} ${ev.descripcion || ""}`.toLowerCase();
      unidad = /inversi|invertir|fix/.test(texto) ? "desarrolladora" : /vend|propiedad|tasaci/.test(texto) && !/inmobiliaria|club|aviso/.test(texto) ? "inmobiliaria" : "ranka_by_cire";
      embudo = unidad === "desarrolladora" ? "inversores" : unidad === "inmobiliaria" ? "vendedores_motivados" : "inmobiliarias";
      const perfil = unidad === "desarrolladora" ? "inversor" : unidad === "inmobiliaria" ? "vendedor_motivado" : "inmobiliaria";
      await sb.from("crm_contact_profiles").upsert({ contact_id: c.id, perfil }, { onConflict: "contact_id,perfil", ignoreDuplicates: true });
      const ins = await sb.from("crm_relations").insert({ contact_id: c.id, unidad, embudo, etapa: embudo === "inmobiliarias" ? "llamada_agendada" : "contactado", responsable: unidad === "ranka_by_cire" ? "sofi" : "mati", origen: "agenda de Google" }).select("id,unidad,embudo,etapa,responsable").single();
      rel = ins.data;
    }
    if (rel && embudo === "inmobiliarias" && ["nuevo", "contactado"].includes(rel.etapa)) await sb.from("crm_relations").update({ etapa: "llamada_agendada" }).eq("id", rel.id);
    const responsable = rel?.responsable || "mati";
    const fila = { contact_id: c.id, unidad, responsable, inicio: ev.inicio, fin: ev.fin || null, titulo: ev.titulo || null, link_reunion: ev.link || null, origen: "google_calendar", google_event_id: ev.id, updated_at: new Date().toISOString() };
    // Busca la reunión por el id estable del evento (y por el formato viejo uid|inicio)
    let { data: previa } = await sb.from("crm_reuniones").select("id,inicio,estado,google_event_id").eq("google_event_id", ev.id).maybeSingle();
    if (!previa && !ev.id.includes("|")) previa = (await sb.from("crm_reuniones").select("id,inicio,estado,google_event_id").like("google_event_id", `${ev.id.replace(/[\\%_]/g, "\\$&")}|%`).in("estado", ["agendada", "confirmada"]).order("inicio", { ascending: false }).limit(1).maybeSingle()).data;
    if (ev.cancelado) { if (previa) await sb.from("crm_reuniones").update({ estado: "cancelada" }).eq("id", previa.id); res.push({ id: ev.id, cancelada: true }); continue; }
    if (!previa) {
      await sb.from("crm_reuniones").insert(fila);
      await sb.from("crm_activities").insert({ contact_id: c.id, unidad, tipo: "reunion_agendada", detalle: { inicio: ev.inicio, titulo: ev.titulo } });
      // Tarea de preparación: revisar la ficha 2 horas antes (o ya, si la reunión es antes de eso)
      const prep = new Date(Math.max(Date.now(), new Date(ev.inicio).getTime() - 2 * 3600e3)).toISOString();
      await sb.from("crm_tareas").insert({ contact_id: c.id, relation_id: rel?.id || null, unidad, tipo: "reunion", titulo: `Preparar la reunión: ${ev.titulo || c.nombre}`, vence: prep, responsable, prioridad: "normal", origen: "automatizacion" });
    } else if (new Date(previa.inicio).getTime() !== new Date(ev.inicio).getTime()) {
      await sb.from("crm_reuniones").update({ ...fila, estado: "agendada", recordatorio_24h_at: null, recordatorio_1h_at: null }).eq("id", previa.id);
      await sb.from("crm_activities").insert({ contact_id: c.id, unidad, tipo: "reunion_reprogramada", detalle: { antes: previa.inicio, ahora: ev.inicio } });
    } else if (previa.google_event_id !== ev.id) {
      await sb.from("crm_reuniones").update({ google_event_id: ev.id }).eq("id", previa.id);
    }
    res.push({ id: ev.id, contacto: c.nombre, unidad });
  }
  return new Response(JSON.stringify({ procesados: res.length, res }), { headers: { "Content-Type": "application/json" } });
});
