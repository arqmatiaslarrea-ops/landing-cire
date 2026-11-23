// Automatizaciones del CRM. La dispara pg_cron (sin consumo de IA):
// - "ciclo" cada 5 min: secuencias, envíos aprobados, recordatorios de reuniones y avisos de handoff.
// - "aviso_tanda" L a V 8:55: tanda de 5 recontactos, alertas del día y compradores nuevos.
// - "reporte_semanal" lunes 8:00: actividad propia y de los socios, solo a Mati.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CRM = "https://landing-cire.vercel.app";
const FN = "https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1";
const REMITENTE = (Deno.env.get("CRM_REMITENTE") || "").trim() || "CIRE <crm@rankaagency.com>"; // secreto CRM_REMITENTE
let RESPONDER_A = (Deno.env.get("CRM_RESPONDER_A") || "").trim(); // secreto CRM_RESPONDER_A; si falta, el mail del usuario "mati"
const WHATSAPP = "https://wa.me/5491154950446";
const HORA = (d: string | Date) => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) + " h";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

let claveResend: string | null = null;
async function secreto(nombre: string) {
  const { data } = await sb.rpc("crm_secreto", { p_nombre: nombre });
  return data as string | null;
}
async function mail(to: string | string[], asunto: string, html: string) {
  claveResend ??= await secreto("resend_api_key");
  if (!RESPONDER_A) RESPONDER_A = String((await sb.from("crm_usuarios").select("email").eq("clave", "mati").maybeSingle()).data?.email || "");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${claveResend}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: REMITENTE, ...(RESPONDER_A ? { reply_to: RESPONDER_A } : {}), to: Array.isArray(to) ? to : [to], subject: asunto, html }),
  });
  return { ok: r.ok, txt: (await r.text()).slice(0, 300) };
}
const envolver = (cuerpo: string) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d2629;max-width:560px">${cuerpo}</div>`;
const parrafos = (t: string) => esc(t).split("\n").map((l) => `<p>${l.replace(/(https?:\/\/\S+)/g, '<a href="$1" style="color:#d9430f">$1</a>')}</p>`).join("");
async function emailDe(clave: string) {
  const { data } = await sb.from("crm_usuarios").select("email,activo").eq("clave", clave).maybeSingle();
  return data && data.activo && !data.email.endsWith("@pendiente") ? data.email : null;
}
// Las tareas automáticas van a alguien que entra al CRM: si el responsable está inactivo, a Mati
let activos: Set<string> | null = null;
async function responsableActivo(clave: string | null) {
  if (!activos) {
    const { data } = await sb.from("crm_usuarios").select("clave").eq("activo", true);
    activos = new Set((data || []).map((u: any) => u.clave));
  }
  return clave && activos.has(clave) ? clave : "mati";
}
// Una tarea automática se crea una sola vez: si ya existe (abierta, o cerrada en los últimos 7 días), no se repite
async function tareaUnica(contact_id: string, relation_id: string | null, unidad: string, titulo: string, responsable: string | null, tipo = "llamar", prioridad = "alta") {
  const { data } = await sb.from("crm_tareas").select("id,hecha,created_at").eq("contact_id", contact_id).eq("titulo", titulo)
    .or(`hecha.eq.false,created_at.gte.${new Date(Date.now() - 7 * 864e5).toISOString()}`).limit(1);
  if (data && data.length) return;
  await sb.from("crm_tareas").insert({ contact_id, relation_id, unidad, tipo, titulo, vence: new Date().toISOString(), responsable: await responsableActivo(responsable), prioridad, origen: "automatizacion" });
}

const RIESGO = /suces|hered|herenc|deud|embarg|legal|ocupa|remate/i;
async function secuencias() {
  const { data: secs } = await sb.from("crm_secuencias").select("*").eq("activa", true);
  const { data: ins } = await sb.from("crm_inscripciones").select("*, crm_contacts(nombre,email), crm_relations(unidad,responsable,etapa,estado)").eq("estado", "activa");
  for (const i of ins || []) {
    const s = secs?.find((x: any) => x.id === i.secuencia_id);
    const c = i.crm_contacts, r = i.crm_relations;
    if (!s || !c?.email || !r) continue;
    if (r.estado === "descartado") { await sb.from("crm_inscripciones").update({ estado: "terminada", motivo_fin: "Contacto descartado" }).eq("id", i.id); continue; }
    if (i.paso_actual === 1 && s.id === "vendedores") {
      const { data: p } = await sb.from("crm_contact_profiles").select("datos").eq("contact_id", i.contact_id).eq("perfil", "vendedor_motivado").maybeSingle();
      const d = p?.datos || {};
      if (RIESGO.test(`${d.situacion || ""} ${d.info_adicional || ""}`) || /urgente|menos de 2/i.test(d.urgencia || "")) {
        await tareaUnica(i.contact_id, i.relation_id, r.unidad, "Handoff: urgencia, sucesión, deuda u ocupación. Llamar y hacer el descubrimiento", r.responsable);
        await sb.from("crm_inscripciones").update({ estado: "pausada_humano", motivo_fin: "Handoff por urgencia o situación legal" }).eq("id", i.id);
        continue;
      }
    }
    if (i.paso_actual === 2) await tareaUnica(i.contact_id, i.relation_id, r.unidad, "Dos mensajes sin respuesta: llamar", r.responsable);
    const paso = s.pasos[i.paso_actual];
    if (!paso) { await sb.from("crm_inscripciones").update({ estado: "terminada", motivo_fin: "Secuencia completa" }).eq("id", i.id); continue; }
    if (Date.now() < new Date(i.inicio).getTime() + paso.dia * 864e5) continue;
    const { data: ya } = await sb.from("crm_envios").select("id").eq("inscripcion_id", i.id).eq("paso", i.paso_actual).maybeSingle();
    if (ya) continue;
    const nombre = String(c.nombre).split(" ")[0];
    await sb.from("crm_envios").insert({
      inscripcion_id: i.id, contact_id: i.contact_id, canal: "email", destino: c.email, paso: i.paso_actual,
      asunto: paso.asunto.replaceAll("{{nombre}}", nombre), cuerpo: paso.cuerpo.replaceAll("{{nombre}}", nombre),
      estado: s.tandas_aprobadas >= 3 ? "aprobado" : "pendiente_aprobacion",
    });
  }
  const { data: env } = await sb.from("crm_envios").select("*").eq("estado", "aprobado").lte("programado", new Date().toISOString()).limit(40);
  for (const e of env || []) {
    // Si la inscripción se pausó o terminó mientras el mail esperaba (por ejemplo, el lead agendó), no se manda
    const { data: ins2 } = await sb.from("crm_inscripciones").select("estado,paso_actual").eq("id", e.inscripcion_id).maybeSingle();
    if (ins2 && ins2.estado !== "activa") { await sb.from("crm_envios").update({ estado: "descartado", respuesta: `Inscripción ${ins2.estado}` }).eq("id", e.id); continue; }
    const r = await mail(e.destino, e.asunto, envolver(parrafos(e.cuerpo)));
    await sb.from("crm_envios").update({ estado: r.ok ? "enviado" : "error", enviado_at: new Date().toISOString(), respuesta: r.txt }).eq("id", e.id);
    if (r.ok) {
      await sb.from("crm_activities").insert({ contact_id: e.contact_id, tipo: "email_secuencia", detalle: { asunto: e.asunto, paso: e.paso } });
      if (ins2 && ins2.paso_actual === e.paso) await sb.from("crm_inscripciones").update({ paso_actual: e.paso + 1 }).eq("id", e.inscripcion_id);
    }
  }
}

async function recordatorios() {
  const ahora = Date.now();
  const { data: rs } = await sb.from("crm_reuniones").select("*, crm_contacts(nombre,email,telefono)").in("estado", ["agendada", "confirmada", "no_asistio"]).gte("inicio", new Date(ahora - 3 * 864e5).toISOString());
  for (const m of rs || []) {
    const c = m.crm_contacts || {};
    const falta = new Date(m.inicio).getTime() - ahora;
    const anticipacion = new Date(m.inicio).getTime() - new Date(m.created_at).getTime();
    const nombre = esc(String(c.nombre || "").split(" ")[0]);
    const confirmar = `${FN}/crm-confirmar?t=${m.token_confirmacion}`;
    const enlace = m.link_reunion ? `<p>Link de la reunión: <a href="${esc(m.link_reunion)}">${esc(m.link_reunion)}</a></p>` : "";
    // El recordatorio de 24 h solo tiene sentido si se agendó con más de 6 h de anticipación
    if (m.estado !== "no_asistio" && c.email && falta > 3600e3 && falta <= 24 * 3600e3 && anticipacion > 6 * 3600e3 && !m.recordatorio_24h_at) {
      const esHoy = new Date(m.inicio).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) === new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
      const r = await mail(c.email, `${esHoy ? "Hoy" : "Mañana"} tenemos la reunión, ${nombre}: ¿la confirmás?`, envolver(`<p>Hola ${nombre}, te recuerdo la reunión del <b>${HORA(m.inicio)}</b>.</p>${enlace}<p><a href="${confirmar}" style="background:#ff551a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Confirmo que voy</a></p><p>Si no podés, respondé este mail y la pasamos a otro horario.</p>`));
      await sb.from("crm_reuniones").update({ recordatorio_24h_at: new Date().toISOString() }).eq("id", m.id);
      await sb.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: "recordatorio", detalle: { tipo: "24h", ok: r.ok, respuesta: r.txt } });
    }
    if (m.estado !== "no_asistio" && c.email && falta > 0 && falta <= 3600e3 && !m.recordatorio_1h_at) {
      const r = await mail(c.email, `En una hora nos vemos, ${nombre}`, envolver(`<p>Hola ${nombre}, en una hora arranca la reunión (${HORA(m.inicio)}).</p>${enlace}`));
      await sb.from("crm_reuniones").update({ recordatorio_1h_at: new Date().toISOString() }).eq("id", m.id);
      await sb.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: "recordatorio", detalle: { tipo: "1h", ok: r.ok, respuesta: r.txt } });
    }
    const horaCorta = new Date(m.inicio).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    if (m.estado === "agendada" && falta > 0 && falta <= 3 * 3600e3) await tareaUnica(m.contact_id, null, m.unidad, `No confirmó la reunión de las ${horaCorta}: llamar`, m.responsable, "llamar");
    if (["agendada", "confirmada"].includes(m.estado) && falta < -2 * 3600e3) await tareaUnica(m.contact_id, null, m.unidad, `¿Se hizo la reunión de las ${horaCorta}? Marcá si asistió o no`, m.responsable, "revisar", "normal");
    if (m.estado === "no_asistio") {
      const { data: ya } = await sb.from("crm_activities").select("id").eq("contact_id", m.contact_id).eq("tipo", "reagenda").gte("created_at", m.inicio).maybeSingle();
      if (!ya) {
        let r = { ok: false, txt: "sin email" };
        if (c.email) r = await mail(c.email, `${nombre}, ¿reagendamos?`, envolver(`<p>Hola ${nombre}, no pudimos encontrarnos en la reunión. ¿Te queda bien otro horario? Respondé este mail o escribinos por <a href="${WHATSAPP}">WhatsApp</a> y la coordinamos.</p>`));
        await sb.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: "reagenda", detalle: { ok: r.ok, respuesta: r.txt } });
        await tareaUnica(m.contact_id, null, m.unidad, "No asistió a la reunión: reagendar por WhatsApp", m.responsable, "whatsapp");
      }
    }
  }
}

async function avisoTanda() {
  const { data: rels } = await sb.from("crm_vista_relaciones").select("contact_id,nombre,telefono,barrio,situacion,unidad,etapa,estado,temperatura,ultima_gestion")
    .in("etapa", ["nuevo", "contactado", "descubrimiento"]).neq("estado", "descartado").not("telefono", "is", null).limit(3000);
  const { data: abiertas } = await sb.from("crm_tareas").select("contact_id").eq("hecha", false);
  const conTarea = new Set((abiertas || []).map((t: any) => t.contact_id));
  const tanda = (rels || []).filter((r: any) => !conTarea.has(r.contact_id) && (!r.ultima_gestion || Date.now() - new Date(r.ultima_gestion).getTime() > 7 * 864e5))
    .sort((a: any, b: any) => b.temperatura - a.temperatura).slice(0, 5);
  const wa = (t: string) => { let d = String(t).replace(/\D/g, ""); if (d.length === 10) d = "549" + d; return `https://wa.me/${d}`; };
  const filas = tanda.map((r: any, i: number) => `<tr><td style="padding:6px 10px 6px 0"><b>${i + 1}. ${esc(r.nombre)}</b><br><span style="color:#5f6b6f">${esc(r.situacion || "")} ${r.barrio ? esc(r.barrio) : ""}</span></td><td><a href="${wa(r.telefono)}">WhatsApp</a> | <a href="${CRM}/contactos/${r.contact_id}">Ficha</a></td></tr>`).join("");
  const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const { data: alertas } = await sb.from("crm_notificaciones").select("tipo,titulo,detalle,link").in("para", ["mati", "todos"]).gte("created_at", hoy + "T00:00:00-03:00").order("tipo");
  const { count: compr } = await sb.from("crm_relations").select("id", { count: "exact", head: true }).eq("embudo", "compradores").eq("etapa", "nuevo").neq("estado", "descartado");
  const bloqueAlertas = (alertas || []).length ? `<h3 style="margin:18px 0 6px">Alertas de hoy</h3><ul>${(alertas || []).map((a: any) => `<li><b>${esc(a.titulo)}</b>${a.detalle ? `<br><span style="color:#5f6b6f">${esc(a.detalle)}</span>` : ""}${a.link ? ` <a href="${CRM}${a.link}">Abrir</a>` : ""}</li>`).join("")}</ul>` : "";
  const bloqueCompr = compr ? `<p>Compradores de campañas sin contactar: <b>${compr}</b>. <a href="${CRM}/compradores">Ver compradores</a></p>` : "";
  const mati = await emailDe("mati");
  if (mati && (tanda.length || bloqueAlertas)) await mail(mati, "Seguimiento de hoy: tanda, alertas y compradores", envolver(`<p>Buen día. Estos son los 5 recontactos de hoy, ordenados por temperatura:</p><table>${filas}</table><p>La tanda completa de WhatsApp (vendedores e inmobiliarias) está en <a href="${CRM}/tanda">Tanda de WhatsApp</a>. Registrá cada gestión en <a href="${CRM}">Mi día</a>. Recordá: si no hubo número, no cuenta como oferta.</p>${bloqueCompr}${bloqueAlertas}`));
}

async function reporteSemanal() {
  const desde = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ data: us }, { data: acts }, { data: tareas }, { data: rels }, { data: ofs }, { data: reus }] = await Promise.all([
    sb.from("crm_usuarios").select("clave,nombre"),
    sb.from("crm_activities").select("autor,tipo,contact_id").gte("created_at", desde).neq("autor", "sistema"),
    sb.from("crm_tareas").select("responsable,hecha,hecha_at,vence"),
    sb.from("crm_relations").select("responsable,created_at,primer_contacto_at,origen").gte("created_at", desde),
    sb.from("crm_ofertas").select("responsable,monto_usd,fecha,cuenta_plan_260").gte("fecha", desde.slice(0, 10)),
    sb.from("crm_reuniones").select("responsable,estado,inicio").gte("inicio", desde),
  ]);
  const { count: plan } = await sb.from("crm_ofertas").select("id", { count: "exact", head: true }).eq("cuenta_plan_260", true);
  const filas = (us || []).map((u: any) => {
    const a = (acts || []).filter((x: any) => x.autor === u.clave);
    const t = (tareas || []).filter((x: any) => x.responsable === u.clave);
    const r = (rels || []).filter((x: any) => x.responsable === u.clave);
    const resp = r.filter((x: any) => x.primer_contacto_at).map((x: any) => (new Date(x.primer_contacto_at).getTime() - new Date(x.created_at).getTime()) / 6e4);
    const prom = resp.length ? Math.round(resp.reduce((s: number, v: number) => s + v, 0) / resp.length) : null;
    const cel = (v: unknown) => `<td style="padding:6px 10px;border-bottom:1px solid #dfe3e2;text-align:right">${v}</td>`;
    return `<tr><td style="padding:6px 10px;border-bottom:1px solid #dfe3e2"><b>${esc(u.nombre)}</b></td>${cel(new Set(a.map((x: any) => x.contact_id)).size)}${cel(a.filter((x: any) => x.tipo === "llamada").length)}${cel(a.filter((x: any) => x.tipo === "whatsapp").length)}${cel(a.filter((x: any) => x.tipo === "cambio_etapa").length)}${cel(t.filter((x: any) => x.hecha && x.hecha_at >= desde).length)}${cel(t.filter((x: any) => !x.hecha && new Date(x.vence) < new Date()).length)}${cel(r.length)}${cel(prom == null ? "—" : prom < 60 ? prom + " min" : Math.round(prom / 60) + " h")}${cel((ofs || []).filter((x: any) => x.responsable === u.clave).length)}${cel((reus || []).filter((x: any) => x.responsable === u.clave && x.estado === "realizada").length)}</tr>`;
  }).join("");
  const cab = ["Persona", "Contactos gestionados", "Llamadas", "WhatsApp", "Avances de etapa", "Tareas hechas", "Tareas vencidas", "Leads nuevos", "1.ª respuesta prom.", "Ofertas", "Reuniones hechas"].map((h) => `<th style="text-align:left;padding:6px 10px;font-size:12px;color:#5f6b6f">${h}</th>`).join("");
  const mati = await emailDe("mati");
  if (mati) await mail(mati, "Reporte semanal del equipo (solo para vos)", envolver(`<p>Semana cerrada al ${HORA(new Date())}. Este reporte llega solo a vos.</p><table style="border-collapse:collapse;font-size:13px"><tr>${cab}</tr>${filas}</table><p>Plan 260: <b>${plan ?? 0}</b> ofertas con número desde el 5/10. Leads nuevos de la semana: ${(rels || []).length}.</p><p><a href="${CRM}/tablero">Ver el tablero completo</a></p>`));
}

Deno.serve(async (req) => {
  const sec = await secreto("crm_secreto_interno");
  if (!sec || req.headers.get("x-crm-secreto") !== sec) return new Response("no", { status: 401 });
  const { tarea } = await req.json().catch(() => ({ tarea: "ciclo" }));
  activos = null;
  const errores: string[] = [];
  const correr = async (n: string, f: () => Promise<void>) => { try { await f(); } catch (e) { errores.push(`${n}: ${(e as Error).message}`); } };
  if (tarea === "ciclo") { await correr("secuencias", secuencias); await correr("recordatorios", recordatorios); }
  if (tarea === "aviso_tanda") await correr("aviso_tanda", avisoTanda);
  if (tarea === "reporte_semanal") await correr("reporte", reporteSemanal);
  if (errores.length) console.error(errores);
  return new Response(JSON.stringify({ ok: !errores.length, errores }), { headers: { "Content-Type": "application/json" } });
});
