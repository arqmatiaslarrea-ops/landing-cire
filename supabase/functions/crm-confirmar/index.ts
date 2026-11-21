// Página pública de confirmación de asistencia (link del recordatorio de 24 h).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const pagina = (titulo: string, texto: string) => new Response(
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
  <body style="margin:0;font-family:Arial,sans-serif;background:#eef1f0;color:#1d2629;display:grid;place-items:center;min-height:100vh;padding:16px">
  <div style="background:#fff;border-radius:12px;padding:28px;max-width:420px"><h1 style="margin:0 0 8px;font-size:22px">${titulo}</h1><p style="margin:0;line-height:1.5">${texto}</p></div></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[a-f0-9]{24}$/.test(t)) return pagina("Link inválido", "Revisá que hayas abierto el link completo del mail.");
  const { data: m } = await sb.from("crm_reuniones").select("id,contact_id,unidad,inicio,estado").eq("token_confirmacion", t).maybeSingle();
  if (!m) return pagina("No encontramos la reunión", "Puede que se haya reprogramado. Respondé el mail y lo vemos.");
  if (m.estado === "agendada") {
    await sb.from("crm_reuniones").update({ estado: "confirmada", confirmo_at: new Date().toISOString() }).eq("id", m.id);
    await sb.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: "confirmo_reunion", detalle: { inicio: m.inicio } });
  }
  const h = new Date(m.inicio).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return pagina("¡Listo, quedó confirmada!", `Nos vemos el ${h}. Si te surge algo, respondé el mail del recordatorio.`);
});
