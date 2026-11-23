// Agenda propia para las landings (reemplaza el formulario de Google Calendar y Calendly).
// GET  → próximos 3 días hábiles con 3 horarios libres cada uno, cruzados con el Google Calendar de Mati
//        (crm_calendario_eventos) y las reuniones del CRM.
// POST { lead_id, origen_lead: "inmo"|"inv", inicio, nota } → solo para un lead real recién cargado por el
//        formulario: toma nombre, teléfono y email del lead (no del navegador), revalida el horario, crea la
//        reunión (con los recordatorios de siempre), la tarea de preparación, el aviso y manda la invitación
//        de calendario (.ics) a Mati y al lead.
// POST interno (x-crm-secreto) { accion: "cancelar"|"reprogramar", id } → manda la cancelación o el cambio
//        de horario (.ics con el mismo UID) al lead y a la agenda de Mati. Lo dispara un trigger de crm_reuniones.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const DURACION_MIN = 30;
const PREFERIDOS = ["11:30", "14:30", "16:30"];
const ALTERNATIVOS = ["12:00", "15:00", "17:00", "12:30", "15:30", "17:30", "11:00", "14:00", "16:00"];
const ANTICIPACION_MS = 2 * 3600e3;
const DIAS = 3;
const VIGENCIA_LEAD_MS = 24 * 3600e3; // el lead tiene que haber completado el formulario en las últimas 24 h
const MAX_INTENTOS_IP_HORA = 6;
const RESPONSABLE = "mati";
// Direcciones de mail: no van en el código. Se configuran como secretos de las Edge Functions
// (CRM_REMITENTE, CRM_MAIL_CALENDARIO) y, si faltan, se usa el mail del usuario "mati" del CRM.
const env = (k: string) => (Deno.env.get(k) || "").trim();
const REMITENTE = env("CRM_REMITENTE") || "CIRE <crm@rankaagency.com>";
const MAIL_REMITENTE = REMITENTE.match(/<([^>]+)>/)?.[1] || REMITENTE;
// Dueño del calendario: la dirección iCal secreta de Google lleva el id del calendario (/ical/<id>/private-…)
const duenoCal = (url: string) => { try { const m = String(url || "").match(/\/ical\/([^/]+)\//); return m ? decodeURIComponent(m[1]).toLowerCase() : ""; } catch { return ""; } };
let MAIL_MATI = "", MAIL_CALENDARIO = "";
async function cargarMails() {
  if (MAIL_MATI) return;
  const { data } = await sb.from("crm_usuarios").select("email").eq("clave", "mati").maybeSingle();
  MAIL_MATI = String(data?.email || "");
  const { data: cal } = await sb.from("crm_calendarios").select("ics_url").eq("usuario", "mati").maybeSingle();
  MAIL_CALENDARIO = env("CRM_MAIL_CALENDARIO") || duenoCal(cal?.ics_url) || MAIL_MATI;
}
const CRM = "https://landing-cire.vercel.app";
// Respaldo si la tabla crm_feriados no está disponible
const FERIADOS_RESPALDO = ["2026-12-07", "2026-12-08", "2026-12-25", "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-24", "2027-03-25", "2027-03-26", "2027-04-02", "2027-05-25", "2027-06-21", "2027-07-09", "2027-08-16", "2027-10-11", "2027-12-08"];

const limpio = (v: unknown, n = 200) => (v == null ? null : String(v).replace(/[<>"\r\n]/g, " ").replace(/\s+/g, " ").slice(0, n).trim() || null);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const emailValido = (e: string | null) => !!e && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(e);
const fechaBA = (d: Date) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10); // Buenos Aires es UTC-3 todo el año
const instante = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`);
const etiquetaDia = (dia: string) => new Date(`${dia}T12:00:00-03:00`).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long" });
const HORA = (d: Date) => d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) + " h";

async function feriados() {
  const { data, error } = await sb.from("crm_feriados").select("fecha");
  return new Set(error || !data ? FERIADOS_RESPALDO : data.map((f: any) => String(f.fecha)));
}
async function ocupados(desde: Date, hasta: Date) {
  const [ev, re] = await Promise.all([
    sb.from("crm_calendario_eventos").select("inicio,fin,todo_el_dia").eq("usuario", RESPONSABLE).eq("todo_el_dia", false).lt("inicio", hasta.toISOString()).gt("fin", desde.toISOString()),
    sb.from("crm_reuniones").select("inicio,fin").eq("responsable", RESPONSABLE).in("estado", ["agendada", "confirmada"]).lt("inicio", hasta.toISOString()).gte("inicio", new Date(desde.getTime() - 3 * 3600e3).toISOString()),
  ]);
  return [...(ev.data || []), ...(re.data || [])].map((x: any) => ({ a: new Date(x.inicio).getTime(), b: x.fin ? new Date(x.fin).getTime() : new Date(x.inicio).getTime() + DURACION_MIN * 6e4 }));
}
const libre = (ini: Date, ocup: { a: number; b: number }[]) => {
  const a = ini.getTime(), b = a + DURACION_MIN * 6e4;
  return a - Date.now() >= ANTICIPACION_MS && !ocup.some((o) => o.a < b && o.b > a);
};

async function disponibilidad() {
  const fer = await feriados();
  const dias: string[] = [];
  for (let i = 0; dias.length < DIAS + 2 && i < 20; i++) {
    const dia = fechaBA(new Date(Date.now() + i * 864e5));
    const dow = new Date(`${dia}T12:00:00-03:00`).getUTCDay();
    if (dow !== 0 && dow !== 6 && !fer.has(dia)) dias.push(dia);
  }
  const ocup = await ocupados(instante(dias[0], "00:00"), instante(dias[dias.length - 1], "23:59"));
  const salida: { dia: string; etiqueta: string; horarios: { hora: string; inicio: string }[] }[] = [];
  for (const dia of dias) {
    const elegidos: string[] = [];
    for (const h of [...PREFERIDOS, ...ALTERNATIVOS]) {
      if (elegidos.length >= 3) break;
      if (libre(instante(dia, h), ocup)) elegidos.push(h);
    }
    if (elegidos.length) salida.push({ dia, etiqueta: etiquetaDia(dia), horarios: elegidos.sort().map((h) => ({ hora: h, inicio: instante(dia, h).toISOString() })) });
    if (salida.length >= DIAS) break;
  }
  return salida;
}

// Invitación de calendario: Gmail la muestra como evento y la suma a la agenda (mismo UID para cambios y cancelación)
const icsFecha = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsTexto = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function ics(metodo: "REQUEST" | "CANCEL", uid: string, secuencia: number, ini: Date, fin: Date, titulo: string, desc: string, invitado: { email: string; nombre: string }) {
  return [
    "BEGIN:VCALENDAR", "PRODID:-//CIRE//Agenda//ES", "VERSION:2.0", "CALSCALE:GREGORIAN", `METHOD:${metodo}`,
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${icsFecha(new Date())}`, `DTSTART:${icsFecha(ini)}`, `DTEND:${icsFecha(fin)}`,
    `SUMMARY:${icsTexto(titulo)}`, `DESCRIPTION:${icsTexto(desc)}`, `ORGANIZER;CN="Matías Larrea":mailto:${MAIL_REMITENTE}`,
    `ATTENDEE;CN="${icsTexto(invitado.nombre)}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${invitado.email}`,
    `STATUS:${metodo === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`, `SEQUENCE:${secuencia}`,
    ...(metodo === "REQUEST" ? ["BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Llamada", "END:VALARM"] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
async function mail(to: string, asunto: string, html: string, adjunto?: { ics: string; metodo: string }) {
  const { data: clave } = await sb.rpc("crm_secreto", { p_nombre: "resend_api_key" });
  const cuerpo: any = { from: REMITENTE, ...(MAIL_MATI ? { reply_to: MAIL_MATI } : {}), to: [to], subject: asunto, html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1c;max-width:560px">${html}</div>` };
  if (adjunto) cuerpo.attachments = [{ filename: "invitacion.ics", content: btoa(unescape(encodeURIComponent(adjunto.ics))), content_type: `text/calendar; method=${adjunto.metodo}; charset=UTF-8` }];
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  return { ok: r.ok, txt: (await r.text()).slice(0, 200) };
}

// ---------- Cambios hechos desde el CRM ----------
async function avisarCambio(accion: string, id: string) {
  const { data: m } = await sb.from("crm_reuniones").select("id,contact_id,unidad,inicio,fin,titulo,google_event_id,secuencia_ics,crm_contacts(nombre,email,telefono)").eq("id", id).maybeSingle();
  if (!m || !String(m.google_event_id || "").startsWith("reserva-")) return { omitido: true };
  const c: any = m.crm_contacts || {};
  const ini = new Date(m.inicio), fin = new Date(m.fin || ini.getTime() + DURACION_MIN * 6e4);
  const seq = (m.secuencia_ics || 0) + 1;
  await sb.from("crm_reuniones").update({ secuencia_ics: seq }).eq("id", m.id);
  const metodo = accion === "cancelar" ? "CANCEL" : "REQUEST";
  const nombre = esc(String(c.nombre || "").split(" ")[0] || "");
  const enviados: any = {};
  enviados.calendario = await mail(MAIL_CALENDARIO, `${accion === "cancelar" ? "Cancelada" : "Nuevo horario"}: ${m.titulo || "Llamada CIRE"}`,
    `<p>${accion === "cancelar" ? "Se canceló" : "Se movió"} la llamada desde el CRM${accion === "cancelar" ? "" : `: <b>${HORA(ini)}</b>`}.</p>`,
    { ics: ics(metodo, m.google_event_id, seq, ini, fin, m.titulo || "Llamada CIRE", `Cambio hecho desde el CRM.\nFicha: ${CRM}/contactos/${m.contact_id}`, { email: MAIL_CALENDARIO, nombre: "Matías Larrea" }), metodo });
  if (emailValido(c.email)) {
    enviados.lead = await mail(c.email,
      accion === "cancelar" ? `${nombre}, cancelamos la llamada del ${HORA(ini)}` : `${nombre}, cambiamos el horario: ${HORA(ini)}`,
      accion === "cancelar"
        ? `<p>Hola ${nombre}, tuvimos que cancelar la llamada del <b>${HORA(ini)}</b>. Respondé este mail o escribinos por WhatsApp y coordinamos otro horario.</p>`
        : `<p>Hola ${nombre}, la llamada con el Arq. Matías Larrea pasó a <b>${HORA(ini)}</b>. Si no te queda bien, respondé este mail.</p>`,
      { ics: ics(metodo, m.google_event_id, seq, ini, fin, "Llamada con Matías Larrea (CIRE)", "Te llamamos al teléfono que nos dejaste.", { email: c.email, nombre: c.nombre || "" }), metodo });
  }
  await sb.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: accion === "cancelar" ? "reunion_cancelada" : "reunion_reprogramada", autor: "sistema", detalle: { inicio: m.inicio, enviados } });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    await cargarMails();
    if (req.method === "GET") return json({ dias: await disponibilidad(), duracion: DURACION_MIN });

    const d = await req.json().catch(() => ({}));

    // Llamado interno desde el trigger de crm_reuniones
    if (d.accion) {
      const { data: sec } = await sb.rpc("crm_secreto", { p_nombre: "crm_secreto_interno" });
      if (!sec || req.headers.get("x-crm-secreto") !== sec) return json({ error: "no" }, 401);
      return json(await avisarCambio(String(d.accion), String(d.id)));
    }

    // Límite por IP (guardado en la base, no en memoria)
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "sin-ip";
    const { count: intentos } = await sb.from("crm_reservas_intentos").select("id", { count: "exact", head: true })
      .eq("ip", ip).gte("created_at", new Date(Date.now() - 3600e3).toISOString());
    if ((intentos || 0) >= MAX_INTENTOS_IP_HORA) return json({ error: "Demasiados intentos. Escribinos por WhatsApp y coordinamos." }, 429);
    await sb.from("crm_reservas_intentos").insert({ ip, lead_id: limpio(d.lead_id, 40) });

    // Solo un lead real, recién cargado por el formulario. Los datos salen del lead, no del navegador.
    const tabla = d.origen_lead === "inv" ? "inv_leads" : "inmo_leads";
    const unidad = d.origen_lead === "inv" ? "desarrolladora" : "inmobiliaria";
    const leadId = limpio(d.lead_id, 40);
    if (!leadId || !/^[0-9a-f-]{36}$/i.test(leadId)) return json({ error: "Completá el formulario para agendar la llamada." }, 400);
    const { data: lead } = await sb.from(tabla).select("id,nombre,telefono,email,created_at").eq("id", leadId).maybeSingle();
    if (!lead || Date.now() - new Date(lead.created_at).getTime() > VIGENCIA_LEAD_MS) return json({ error: "Tu consulta venció. Escribinos por WhatsApp y coordinamos." }, 403);
    const nombre = limpio(lead.nombre, 80) || "Sin nombre", telefono = limpio(lead.telefono, 40), email = emailValido(limpio(lead.email, 120)) ? limpio(lead.email, 120)!.toLowerCase() : null;

    const ini = new Date(String(d.inicio || ""));
    if (isNaN(+ini)) return json({ error: "Elegí un horario." }, 400);
    const fin = new Date(ini.getTime() + DURACION_MIN * 6e4);
    const disp = await disponibilidad();
    if (!disp.some((x) => x.horarios.some((h) => new Date(h.inicio).getTime() === ini.getTime()))) return json({ error: "Ese horario se acaba de ocupar. Elegí otro.", dias: disp }, 409);

    const { data: cid, error } = await sb.rpc("crm_upsert_contact", { p_nombre: nombre, p_email: email, p_tel: telefono });
    if (error || !cid) return json({ error: "No pudimos registrar la reserva. Escribinos por WhatsApp." }, 500);

    // Una sola llamada futura por persona
    const { data: previa } = await sb.from("crm_reuniones").select("inicio").eq("contact_id", cid).in("estado", ["agendada", "confirmada"]).gt("inicio", new Date().toISOString()).limit(1).maybeSingle();
    if (previa) return json({ error: `Ya tenés una llamada agendada el ${HORA(new Date(previa.inicio))}. Si querés cambiarla, respondé el mail de confirmación.` }, 409);

    const embudo = unidad === "desarrolladora" ? "inversores" : "vendedores_motivados";
    const { data: rel } = await sb.from("crm_relations").select("id").eq("contact_id", cid).eq("embudo", embudo).maybeSingle();

    const titulo = `Llamada CIRE · ${nombre}`;
    const { data: reu, error: errReu } = await sb.from("crm_reuniones").insert({ contact_id: cid, unidad, inicio: ini.toISOString(), fin: fin.toISOString(), titulo, origen: d.origen_lead === "inv" ? "cireinversores.com" : "cireinmobiliaria.com", responsable: RESPONSABLE }).select("id").single();
    if (errReu || !reu) {
      if ((errReu as any)?.code === "23505") return json({ error: "Ese horario se acaba de ocupar. Elegí otro.", dias: await disponibilidad() }, 409);
      return json({ error: "No pudimos registrar la reserva. Escribinos por WhatsApp." }, 500);
    }
    const uid = `reserva-${reu.id}@cire`;
    await sb.from("crm_reuniones").update({ google_event_id: uid }).eq("id", reu.id);
    const nota = limpio(d.nota, 300);
    await sb.from("crm_activities").insert({ contact_id: cid, unidad, tipo: "reunion_agendada", autor: "sistema", detalle: { inicio: ini.toISOString(), titulo, origen: tabla, nota } });
    await sb.from("crm_tareas").insert({ contact_id: cid, relation_id: rel?.id || null, unidad, tipo: "reunion", titulo: `Preparar la llamada con ${nombre}`, vence: new Date(Math.max(Date.now(), ini.getTime() - 2 * 3600e3)).toISOString(), responsable: RESPONSABLE, prioridad: "normal", origen: "automatizacion" });
    await sb.from("crm_notificaciones").insert({ para: RESPONSABLE, tipo: "aviso", titulo: `Llamada agendada: ${nombre}`, detalle: `${HORA(ini)} · ${telefono || email || ""}`, link: `/contactos/${cid}` });

    const n = esc(nombre), primer = esc(nombre.split(" ")[0]);
    const desc = `Te llamamos al ${telefono || "teléfono que nos dejaste"}.${nota ? `\n${nota}` : ""}\nSi necesitás cambiar el horario, respondé el mail de confirmación.`;
    const descMati = `${unidad === "desarrolladora" ? "Inversor" : "Vendedor"} desde la landing.\nTeléfono: ${telefono || "—"}\nEmail: ${email || "—"}${nota ? `\n${nota}` : ""}\nFicha: ${CRM}/contactos/${cid}`;
    const resumen = `<p><b>${n}</b> agendó una llamada desde la landing de ${unidad === "desarrolladora" ? "inversores" : "la inmobiliaria"}.</p><p><b>${HORA(ini)}</b> (${DURACION_MIN} min)<br>Teléfono: ${esc(telefono || "—")}<br>Email: ${esc(email || "—")}</p>${nota ? `<p>${esc(nota)}</p>` : ""}<p><a href="${CRM}/contactos/${cid}">Abrir la ficha en el CRM</a></p>`;
    const enviados: any = {};
    enviados.calendario = await mail(MAIL_CALENDARIO, titulo, resumen, { ics: ics("REQUEST", uid, 0, ini, fin, titulo, descMati, { email: MAIL_CALENDARIO, nombre: "Matías Larrea" }), metodo: "REQUEST" });
    enviados.mati = MAIL_MATI && MAIL_MATI !== MAIL_CALENDARIO ? await mail(MAIL_MATI, `Llamada agendada: ${nombre} · ${HORA(ini)}`, resumen) : null;
    if (email) enviados.lead = await mail(email, `Listo, ${nombre.split(" ")[0]}: te llamamos el ${HORA(ini)}`, `<p>Hola ${primer}, quedó agendada la llamada con el Arq. Matías Larrea.</p><p><b>${HORA(ini)}</b> · ${DURACION_MIN} minutos<br>Te llamamos al ${esc(telefono || "teléfono que nos dejaste")}.</p><p>Si no podés, respondé este mail y la pasamos a otro horario.</p>`, { ics: ics("REQUEST", uid, 0, ini, fin, "Llamada con Matías Larrea (CIRE)", desc, { email, nombre }), metodo: "REQUEST" });
    await sb.from("crm_activities").insert({ contact_id: cid, unidad, tipo: "invitacion_calendario", autor: "sistema", detalle: enviados });

    return json({ ok: true, inicio: ini.toISOString(), etiqueta: HORA(ini) });
  } catch (_e) {
    return json({ error: "No pudimos registrar la reserva. Escribinos por WhatsApp." }, 500);
  }
});
