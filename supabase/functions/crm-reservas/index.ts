// Agenda propia para las landings (reemplaza el formulario de Google Calendar y Calendly).
// GET  ?unidad=inmobiliaria|desarrolladora → próximos 3 días hábiles con 3 horarios libres cada uno,
//      cruzados con el Google Calendar de Mati (crm_calendario_eventos) y las reuniones del CRM.
// POST { nombre, telefono, email, inicio, unidad, origen, nota } → vuelve a chequear el horario, crea la
//      reunión en el CRM (con los recordatorios de siempre), la tarea de preparación, el aviso y manda
//      la invitación de calendario (.ics) a Mati y al lead.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const DURACION_MIN = 30;
const PREFERIDOS = ["11:30", "14:30", "16:30"];
const ALTERNATIVOS = ["12:00", "15:00", "17:00", "12:30", "15:30", "17:30", "11:00", "14:00", "16:00"];
const ANTICIPACION_MS = 2 * 3600e3;
const DIAS = 3;
const RESPONSABLE = "mati";
const MAIL_MATI = "arqmatiaslarrea@gmail.com"; // aviso por mail
const MAIL_CALENDARIO = "larrea869@gmail.com"; // dueño del Google Calendar de Mati: la invitación va ahí
const REMITENTE = "Matías Larrea · CIRE <mati@rankaagency.com>";
const CRM = "https://landing-cire.vercel.app";
// Feriados nacionales (Argentina) para no ofrecer turnos
const FERIADOS = new Set(["2026-12-08", "2026-12-25", "2027-01-01", "2027-02-15", "2027-02-16", "2027-03-24", "2027-04-02", "2027-04-26", "2027-05-01", "2027-05-25", "2027-06-17", "2027-06-20", "2027-07-09"]);

const corta = (v: unknown, n = 200) => (v == null ? null : String(v).replace(/[<>"]/g, "").slice(0, n).trim() || null);
const fechaBA = (d: Date) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10); // Buenos Aires es UTC-3 todo el año
const instante = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`);
const etiquetaDia = (dia: string) => new Date(`${dia}T12:00:00-03:00`).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long" });
const HORA = (d: Date) => d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) + " h";

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
  const dias: string[] = [];
  const d = new Date();
  for (let i = 0; dias.length < DIAS + 2 && i < 20; i++) {
    const dia = fechaBA(new Date(d.getTime() + i * 864e5));
    const dow = new Date(`${dia}T12:00:00-03:00`).getUTCDay();
    if (dow !== 0 && dow !== 6 && !FERIADOS.has(dia)) dias.push(dia);
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

// Invitación de calendario: Gmail la muestra como evento con "Sí / No" y la suma a la agenda
const icsFecha = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsTexto = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
function ics(uid: string, ini: Date, fin: Date, titulo: string, desc: string, invitados: { email: string; nombre: string }[]) {
  return [
    "BEGIN:VCALENDAR", "PRODID:-//CIRE//Agenda//ES", "VERSION:2.0", "CALSCALE:GREGORIAN", "METHOD:REQUEST",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${icsFecha(new Date())}`, `DTSTART:${icsFecha(ini)}`, `DTEND:${icsFecha(fin)}`,
    `SUMMARY:${icsTexto(titulo)}`, `DESCRIPTION:${icsTexto(desc)}`, "ORGANIZER;CN=Matías Larrea:mailto:mati@rankaagency.com",
    ...invitados.map((i) => `ATTENDEE;CN=${icsTexto(i.nombre)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${i.email}`),
    "STATUS:CONFIRMED", "SEQUENCE:0", "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Llamada", "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
async function mail(to: string, asunto: string, html: string, adjunto?: string) {
  const { data: clave } = await sb.rpc("crm_secreto", { p_nombre: "resend_api_key" });
  const cuerpo: any = { from: REMITENTE, reply_to: MAIL_MATI, to: [to], subject: asunto, html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1c;max-width:560px">${html}</div>` };
  if (adjunto) cuerpo.attachments = [{ filename: "invitacion.ics", content: btoa(unescape(encodeURIComponent(adjunto))), content_type: "text/calendar; method=REQUEST; charset=UTF-8" }];
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  return { ok: r.ok, txt: (await r.text()).slice(0, 200) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (req.method === "GET") return json({ dias: await disponibilidad(), duracion: DURACION_MIN });

    const d = await req.json().catch(() => ({}));
    const nombre = corta(d.nombre, 80), telefono = corta(d.telefono, 40), email = corta(d.email, 120)?.toLowerCase() || null;
    const unidad = d.unidad === "desarrolladora" ? "desarrolladora" : "inmobiliaria";
    if (!nombre || (!telefono && !email)) return json({ error: "Faltan tus datos de contacto." }, 400);
    const ini = new Date(String(d.inicio || ""));
    if (isNaN(+ini)) return json({ error: "Elegí un horario." }, 400);
    const fin = new Date(ini.getTime() + DURACION_MIN * 6e4);
    // El horario tiene que seguir libre (y ser uno de los ofrecidos)
    const disp = await disponibilidad();
    if (!disp.some((x) => x.horarios.some((h) => new Date(h.inicio).getTime() === ini.getTime()))) return json({ error: "Ese horario se acaba de ocupar. Elegí otro.", dias: disp }, 409);

    const { data: cid, error } = await sb.rpc("crm_upsert_contact", { p_nombre: nombre, p_email: email, p_tel: telefono });
    if (error || !cid) return json({ error: "No pudimos registrar la reserva. Escribinos por WhatsApp." }, 500);
    const embudo = unidad === "desarrolladora" ? "inversores" : "vendedores_motivados";
    const { data: rel } = await sb.from("crm_relations").select("id").eq("contact_id", cid).eq("embudo", embudo).maybeSingle();

    const titulo = `Llamada CIRE · ${nombre}`;
    const { data: reu } = await sb.from("crm_reuniones").insert({ contact_id: cid, unidad, inicio: ini.toISOString(), fin: fin.toISOString(), titulo, origen: corta(d.origen, 60) || "landing", responsable: RESPONSABLE, google_event_id: null }).select("id,token_confirmacion").single();
    const uid = `reserva-${reu?.id}@cire`;
    if (reu) await sb.from("crm_reuniones").update({ google_event_id: uid }).eq("id", reu.id);
    await sb.from("crm_activities").insert({ contact_id: cid, unidad, tipo: "reunion_agendada", detalle: { inicio: ini.toISOString(), titulo, origen: d.origen || "landing", nota: corta(d.nota, 300) } });
    await sb.from("crm_tareas").insert({ contact_id: cid, relation_id: rel?.id || null, unidad, tipo: "reunion", titulo: `Preparar la llamada con ${nombre}`, vence: new Date(Math.max(Date.now(), ini.getTime() - 2 * 3600e3)).toISOString(), responsable: RESPONSABLE, prioridad: "normal", origen: "automatizacion" });
    await sb.from("crm_notificaciones").insert({ para: RESPONSABLE, tipo: "aviso", titulo: `Llamada agendada: ${nombre}`, detalle: `${HORA(ini)} · ${telefono || email}`, link: `/contactos/${cid}` });

    const nota = corta(d.nota, 300);
    const desc = `Te llamamos al ${telefono || "teléfono que nos dejaste"}.${nota ? `\n${nota}` : ""}\nSi necesitás cambiar el horario, respondé el mail de confirmación.`;
    const descMati = `${unidad === "desarrolladora" ? "Inversor" : "Vendedor"} desde la landing.\nTeléfono: ${telefono || "—"}\nEmail: ${email || "—"}${nota ? `\n${nota}` : ""}\nFicha: ${CRM}/contactos/${cid}`;
    const enviados: any = {};
    const resumen = `<p><b>${nombre}</b> agendó una llamada desde la landing de ${unidad === "desarrolladora" ? "inversores" : "la inmobiliaria"}.</p><p><b>${HORA(ini)}</b> (${DURACION_MIN} min)<br>Teléfono: ${telefono || "—"}<br>Email: ${email || "—"}</p>${nota ? `<p>${nota}</p>` : ""}<p><a href="${CRM}/contactos/${cid}">Abrir la ficha en el CRM</a></p>`;
    enviados.calendario = await mail(MAIL_CALENDARIO, titulo, resumen, ics(uid, ini, fin, titulo, descMati, [{ email: MAIL_CALENDARIO, nombre: "Matías Larrea" }]));
    enviados.mati = await mail(MAIL_MATI, `Llamada agendada: ${nombre} · ${HORA(ini)}`, resumen);
    if (email) enviados.lead = await mail(email, `Listo, ${nombre.split(" ")[0]}: te llamamos el ${HORA(ini)}`, `<p>Hola ${nombre.split(" ")[0]}, quedó agendada la llamada con el Arq. Matías Larrea.</p><p><b>${HORA(ini)}</b> · ${DURACION_MIN} minutos<br>Te llamamos al ${telefono || "teléfono que nos dejaste"}.</p><p>Si no podés, respondé este mail y la pasamos a otro horario.</p>`, ics(uid, ini, fin, "Llamada con Matías Larrea (CIRE)", desc, [{ email, nombre }]));
    await sb.from("crm_activities").insert({ contact_id: cid, unidad, tipo: "invitacion_calendario", detalle: enviados });

    return json({ ok: true, inicio: ini.toISOString(), etiqueta: HORA(ini) });
  } catch (e) {
    return json({ error: "No pudimos registrar la reserva. Escribinos por WhatsApp." }, 500);
  }
});
