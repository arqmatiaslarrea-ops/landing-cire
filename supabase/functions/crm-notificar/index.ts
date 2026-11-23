// Avisos del CRM por mail (Resend). La llama la base cuando entra un lead nuevo.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const CRM_URL = "https://landing-cire.vercel.app";
const REMITENTE = "CRM CIRE <crm@rankaagency.com>";
const UNIDADES: Record<string, string> = { ranka: "Ranka Agency", ranka_by_cire: "Ranka by CIRE", inmobiliaria: "Inmobiliaria CIRE", desarrolladora: "Desarrolladora CIRE" };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const { data: sec } = await sb.rpc("crm_secreto", { p_nombre: "crm_secreto_interno" });
  if (!sec || req.headers.get("x-crm-secreto") !== sec) return new Response("no", { status: 401 });
  const { tipo, relation_id } = await req.json();
  if (tipo !== "lead_nuevo") return new Response("ok");
  const { data: r } = await sb.from("crm_relations").select("*, crm_contacts(nombre,telefono,email,barrio)").eq("id", relation_id).single();
  if (!r) return new Response("sin relacion", { status: 404 });
  const { data: perfiles } = await sb.from("crm_contact_profiles").select("perfil,datos").eq("contact_id", r.contact_id);
  const { data: usuarios } = await sb.from("crm_usuarios").select("email,clave,activo");
  const resp = usuarios?.find((u: any) => u.clave === r.responsable && u.activo && !u.email.endsWith("@pendiente"));
  const mati = usuarios?.find((u: any) => u.clave === "mati");
  const destinos = [...new Set([resp?.email, mati?.email].filter(Boolean))] as string[];
  const { data: clave } = await sb.rpc("crm_secreto", { p_nombre: "resend_api_key" });
  const c = r.crm_contacts || {};
  const tel = String(c.telefono || "").replace(/\D/g, "");
  const wa = tel ? `https://wa.me/${tel.length === 10 ? "549" + tel : tel}` : "";
  const datos = (perfiles || []).flatMap((p: any) => Object.entries(p.datos || {}).slice(0, 10).map(([k, v]) => `<tr><td style="color:#5f6b6f;padding:2px 10px 2px 0">${esc(k.replace(/_/g, " "))}</td><td>${esc(v)}</td></tr>`)).join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1d2629">
    <p style="color:#d9430f;font-weight:bold;margin:0">Lead nuevo · ${esc(UNIDADES[r.unidad] || r.unidad)}</p>
    <h2 style="margin:4px 0 10px">${esc(c.nombre)}</h2>
    <p>Entró por <b>${esc(r.origen)}</b>. Responsable: <b>${esc(r.responsable || "sin asignar")}</b>. Meta: primera respuesta en menos de 5 minutos.</p>
    <p>Teléfono: <b>${esc(c.telefono || "—")}</b> · Email: ${esc(c.email || "—")} · Barrio: ${esc(c.barrio || "—")}</p>
    <table style="font-size:14px">${datos}</table>
    <p style="margin-top:16px">${wa ? `<a href="${wa}" style="background:#ff551a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;margin-right:8px">Escribir por WhatsApp</a>` : ""}
    <a href="${CRM_URL}/contactos/${r.contact_id}" style="color:#d9430f">Abrir ficha en el CRM</a></p></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: REMITENTE, to: destinos, subject: `Lead nuevo: ${c.nombre} (${UNIDADES[r.unidad] || r.unidad})`, html }),
  });
  const txt = await res.text();
  await sb.from("crm_activities").insert({ contact_id: r.contact_id, unidad: r.unidad, tipo: "aviso_enviado", detalle: { canal: "email", a: destinos, ok: res.ok, respuesta: txt.slice(0, 300) } });

  // Aviso por WhatsApp a Mati (CallMeBot). Se activa cuando están cargados los secretos callmebot_apikey y callmebot_telefono.
  const [{ data: wKey }, { data: wTel }] = await Promise.all([
    sb.rpc("crm_secreto", { p_nombre: "callmebot_apikey" }), sb.rpc("crm_secreto", { p_nombre: "callmebot_telefono" }),
  ]);
  if (wKey && wTel) {
    const extra = (perfiles || []).flatMap((p: any) => Object.entries(p.datos || {}).filter(([, v]) => v != null && String(v).trim() && String(v).length < 120).slice(0, 6).map(([k, v]) => `• ${k.replace(/_/g, " ")}: ${v}`));
    const texto = [
      `🔔 *Lead nuevo · ${UNIDADES[r.unidad] || r.unidad}*`,
      `*${c.nombre || "Sin nombre"}*`,
      `📞 ${c.telefono || "—"}`,
      c.email ? `✉️ ${c.email}` : "",
      c.barrio ? `📍 ${c.barrio}` : "",
      `Entró por: ${r.origen || "—"} · Responsable: ${r.responsable || "sin asignar"}`,
      ...extra,
      wa ? `\nEscribirle: ${wa}` : "",
      `Ficha: ${CRM_URL}/contactos/${r.contact_id}`,
    ].filter(Boolean).join("\n");
    const u = `https://api.callmebot.com/whatsapp.php?${new URLSearchParams({ phone: String(wTel), text: texto.slice(0, 1500), apikey: String(wKey) })}`;
    const w = await fetch(u).catch((e) => ({ ok: false, text: async () => String(e) } as any));
    const wTxt = String(await w.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200);
    await sb.from("crm_activities").insert({ contact_id: r.contact_id, unidad: r.unidad, tipo: "aviso_enviado", detalle: { canal: "whatsapp", ok: w.ok, respuesta: wTxt } });
  }
  return new Response(txt, { status: res.ok ? 200 : 502 });
});
