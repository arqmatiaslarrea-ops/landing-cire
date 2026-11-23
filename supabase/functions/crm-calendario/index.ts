// Sincroniza el Google Calendar de cada usuario del CRM a partir de su dirección secreta iCal.
// Corre cada 10 minutos (pg_cron) y a pedido desde la Agenda. No requiere scripts ni permisos de Google.
// Los eventos con un invitado externo además pasan por crm-agenda: crean la ficha, la oportunidad y la reunión con recordatorios.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import ICAL from "npm:ical.js@1.5.0";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const DESDE_DIAS = 7, HASTA_DIAS = 60;
const secreto = async (n: string) => (await sb.rpc("crm_secreto", { p_nombre: n })).data as string | null;

// Dueño del calendario: la dirección iCal secreta de Google lleva el id del calendario (/ical/<id>/private-…)
const duenoCal = (url: string) => { try { const m = String(url || "").match(/\/ical\/([^/]+)\//); return m ? decodeURIComponent(m[1]).toLowerCase() : ""; } catch { return ""; } };

type Ocurrencia = { uid: string; recurrente: boolean; inicio: string; fin: string | null; todo_el_dia: boolean; titulo: string | null; ubicacion: string | null; link: string | null; invitados: { email: string; nombre: string }[] };

function expandir(texto: string): Ocurrencia[] {
  const raiz = new ICAL.Component(ICAL.parse(texto));
  raiz.getAllSubcomponents("vtimezone").forEach((tz: any) => ICAL.TimezoneService.register(tz));
  const desde = ICAL.Time.fromJSDate(new Date(Date.now() - DESDE_DIAS * 864e5), true);
  const hasta = ICAL.Time.fromJSDate(new Date(Date.now() + HASTA_DIAS * 864e5), true);
  const vevents = raiz.getAllSubcomponents("vevent");
  const excepciones = new Map<string, any[]>();
  vevents.filter((v: any) => v.hasProperty("recurrence-id")).forEach((v: any) => {
    const uid = v.getFirstPropertyValue("uid");
    excepciones.set(uid, [...(excepciones.get(uid) || []), v]);
  });
  const salida: Ocurrencia[] = [];
  const datos = (item: any, ini: any, fin: any, recurrente = false): Ocurrencia | null => {
    const comp = item.component;
    if (String(comp.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED") return null;
    const desc = String(comp.getFirstPropertyValue("description") || "");
    const link = String(comp.getFirstPropertyValue("x-google-conference") || "") || desc.match(/https:\/\/meet\.google\.com\/[a-z-]+/)?.[0] || null;
    const invitados = comp.getAllProperties("attendee").map((a: any) => ({ email: String(a.getFirstValue() || "").replace(/^mailto:/i, "").toLowerCase(), nombre: String(a.getParameter("cn") || "") }))
      .filter((a: any) => a.email && !a.email.endsWith("calendar.google.com"));
    return { uid: item.uid, recurrente, inicio: ini.toJSDate().toISOString(), fin: fin ? fin.toJSDate().toISOString() : null, todo_el_dia: !!ini.isDate, titulo: item.summary || null, ubicacion: item.location || null, link, invitados };
  };
  for (const v of vevents) {
    if (v.hasProperty("recurrence-id")) continue;
    const ev = new ICAL.Event(v);
    (excepciones.get(ev.uid) || []).forEach((x) => ev.relateException(x));
    if (!ev.isRecurring()) {
      if (ev.endDate.compare(desde) < 0 || ev.startDate.compare(hasta) > 0) continue;
      const d = datos(ev, ev.startDate, ev.endDate); if (d) salida.push(d);
      continue;
    }
    const it = ev.iterator();
    let n: any, vueltas = 0;
    while ((n = it.next()) && vueltas++ < 3000) {
      if (n.compare(hasta) > 0) break;
      const o = ev.getOccurrenceDetails(n);
      if (o.endDate.compare(desde) < 0) continue;
      const d = datos(o.item, o.startDate, o.endDate, true); if (d) salida.push(d);
    }
  }
  return salida;
}

Deno.serve(async (req) => {
  const sec = await secreto("crm_secreto_interno");
  if (!sec || req.headers.get("x-crm-secreto") !== sec) return new Response("no", { status: 401 });
  const cuerpo = await req.json().catch(() => ({}));
  let q = sb.from("crm_calendarios").select("usuario,ics_url");
  if (cuerpo.usuario) q = q.eq("usuario", cuerpo.usuario);
  const { data: cals } = await q;
  const token = await secreto("agenda_token");
  const { data: equipo } = await sb.from("crm_usuarios").select("email");
  const { data: todos } = await sb.from("crm_calendarios").select("ics_url");
  const mails = new Set([...(equipo || []).map((u: any) => String(u.email).toLowerCase()), ...(Deno.env.get("CRM_MAILS_INTERNOS") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean), ...(todos || []).map((c: any) => duenoCal(c.ics_url)).filter(Boolean)]); // + secreto CRM_MAILS_INTERNOS + dueños de calendarios
  const res: any[] = [];

  for (const cal of cals || []) {
    try {
      const r = await fetch(cal.ics_url, { headers: { "User-Agent": "CIRE-CRM" } });
      if (!r.ok) throw new Error(r.status === 404 ? "Google no encuentra el calendario: revisá que la dirección secreta esté completa o generá una nueva." : `Google respondió ${r.status}.`);
      const ocs = expandir(await r.text());
      const desde = new Date(Date.now() - DESDE_DIAS * 864e5).toISOString();
      const ahora = new Date().toISOString();
      const filas = ocs.map(({ recurrente: _r, ...o }) => ({ ...o, usuario: cal.usuario, updated_at: ahora }));
      for (let i = 0; i < filas.length; i += 500) {
        const { error } = await sb.from("crm_calendario_eventos").upsert(filas.slice(i, i + 500), { onConflict: "usuario,uid,inicio" });
        if (error) throw new Error(error.message);
      }
      // Lo que ya no está en Google (borrado o movido) se va del CRM
      await sb.from("crm_calendario_eventos").delete().eq("usuario", cal.usuario).gte("inicio", desde).lt("updated_at", ahora);

      // Id estable por evento: el uid (o uid + inicio si es una serie repetida). Así un cambio de horario actualiza
      // la reunión existente en lugar de crear otra.
      const idDe = (o: Ocurrencia) => (o.recurrente ? `${o.uid}|${o.inicio}` : o.uid);
      // Reservas con invitados externos: alta o actualización en el CRM vía crm-agenda
      const externos = ocs.filter((o) => !o.uid.startsWith("reserva-") && new Date(o.inicio) > new Date(Date.now() - 864e5) && o.invitados.some((i) => !mails.has(i.email)));
      if (externos.length && token) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/crm-agenda`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-agenda-token": token },
          body: JSON.stringify({ eventos: externos.map((o) => ({ id: idDe(o), inicio: o.inicio, fin: o.fin, titulo: o.titulo, descripcion: o.ubicacion || "", link: o.link || "", invitados: o.invitados })) }),
        }).catch(() => null);
      }
      // Reuniones que vinieron de Google y ya no están en el calendario (las borraron o cancelaron): se cancelan en el CRM
      if (ocs.length) {
        const vigentes = new Set(ocs.flatMap((o) => [o.uid, idDe(o), `${o.uid}|${o.inicio}`]));
        const { data: futuras } = await sb.from("crm_reuniones").select("id,google_event_id").eq("origen", "google_calendar").eq("responsable", cal.usuario)
          .in("estado", ["agendada", "confirmada"]).gt("inicio", ahora).lt("inicio", new Date(Date.now() + HASTA_DIAS * 864e5).toISOString());
        for (const f of futuras || []) {
          const gid = String(f.google_event_id || "");
          if (gid && !vigentes.has(gid) && !vigentes.has(gid.split("|")[0])) await sb.from("crm_reuniones").update({ estado: "cancelada" }).eq("id", f.id);
        }
        // Reservas propias (uid reserva-…) que Mati movió en su Google Calendar: se actualiza el horario en el CRM
        for (const o of ocs.filter((x) => x.uid.startsWith("reserva-"))) {
          const { data: r } = await sb.from("crm_reuniones").select("id,inicio").eq("google_event_id", o.uid).in("estado", ["agendada", "confirmada"]).maybeSingle();
          if (r && new Date(r.inicio).getTime() !== new Date(o.inicio).getTime()) await sb.from("crm_reuniones").update({ inicio: o.inicio, fin: o.fin, recordatorio_24h_at: null, recordatorio_1h_at: null }).eq("id", r.id);
        }
      }
      await sb.from("crm_calendarios").update({ ultimo_sync: ahora, ultimo_error: null, eventos: ocs.length }).eq("usuario", cal.usuario);
      res.push({ usuario: cal.usuario, eventos: ocs.length, reservas: externos.length });
    } catch (e) {
      await sb.from("crm_calendarios").update({ ultimo_error: String((e as Error).message || e).slice(0, 300) }).eq("usuario", cal.usuario);
      res.push({ usuario: cal.usuario, error: String(e) });
    }
  }
  return new Response(JSON.stringify({ res }), { headers: { "Content-Type": "application/json" } });
});
