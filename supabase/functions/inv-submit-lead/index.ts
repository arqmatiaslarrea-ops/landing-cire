import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(); const r = hits.get(ip);
  if (!r || now > r.t) { hits.set(ip, { n: 1, t: now + 60_000 }); return false; }
  if (r.n >= 5) return true; r.n++; return false;
}
const s = (v: unknown) => (v == null ? "" : String(v).trim().replace(/[<>]/g, "").slice(0, 500));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return json({ success: false, error: "Demasiadas solicitudes. Intentá más tarde." }, 429);
  try {
    const d = await req.json();
    if (!d?.nombre || s(d.nombre).length < 2) return json({ success: false, error: "Nombre requerido" }, 400);
    if (!d?.telefono || !/^[\d\s\-+()]{7,20}$/.test(String(d.telefono))) return json({ success: false, error: "Teléfono inválido" }, 400);
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email))) return json({ success: false, error: "Email inválido" }, 400);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await sb.from("inv_leads").insert({
      tipo_lead: s(d.tipo_lead || "calificado"), nombre: s(d.nombre), email: s(d.email) || null,
      telefono: s(d.telefono), capital: s(d.capital) || null, perfil: s(d.perfil) || null,
      experiencia: s(d.experiencia) || null, fuente: s(d.fuente) || null, plazo: s(d.plazo) || null,
      objetivo: s(d.objetivo) || null, decision: s(d.decision) || null, ciudad: s(d.ciudad) || null,
      notas: s(d.notas) || null, score: typeof d.score === "number" ? d.score : null,
    });
    if (error) { console.error("insert error", error); return json({ success: false, error: "Ocurrió un error. Intentá nuevamente." }, 500); }
    return json({ success: true });
  } catch (e) {
    console.error(e); return json({ success: false, error: "Ocurrió un error. Intentá nuevamente." }, 500);
  }
});
