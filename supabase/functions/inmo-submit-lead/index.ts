import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, st = 200) => new Response(JSON.stringify(b), { status: st, headers: { ...cors, "Content-Type": "application/json" } });
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(); const r = hits.get(ip);
  if (!r || now > r.t) { hits.set(ip, { n: 1, t: now + 60_000 }); return false; }
  if (r.n >= 5) return true; r.n++; return false;
}
const s = (v: unknown) => (v == null ? "" : String(v).trim().replace(/[<>]/g, "").slice(0, 1000));
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return json({ error: "Demasiadas solicitudes. Intentá más tarde." }, 429);
  try {
    const d = await req.json();
    if (!d?.name || s(d.name).length < 2) return json({ error: "Nombre requerido" }, 400);
    if (!d?.phone || !/^[\d\s\-+()]{7,20}$/.test(String(d.phone))) return json({ error: "Teléfono inválido" }, 400);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await sb.from("inmo_leads").insert({
      nombre: s(d.name), email: s(d.email) || null, telefono: s(d.phone),
      direccion: s(d.propertyAddress) || null, barrio: s(d.neighborhood) || null,
      tipo_propiedad: s(d.propertyType) || null, ambientes: s(d.roomsCount) || null,
      situacion: s(d.problemType) || null, urgencia: s(d.urgency) || null,
      expectativa_precio: s(d.priceExpectation) || null, precio_pretendido: s(d.expectedPrice) || null,
      paga_expensas: s(d.hasExpenses) || null, tamanio_m2: s(d.propertySize) || null,
      info_adicional: s(d.additionalInfo) || null,
      consent_whatsapp: /^s[ií]$/i.test(s(d.consentWhatsapp)),
    }).select("id").single();
    if (error) { console.error("insert error", error); return json({ error: "No pudimos guardar tus datos. Intentá nuevamente." }, 500); }
    return json({ success: true, id: data.id });
  } catch (e) { console.error(e); return json({ error: "No pudimos guardar tus datos. Intentá nuevamente." }, 500); }
});
