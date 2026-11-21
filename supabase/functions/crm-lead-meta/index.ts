// Recibe leads de los formularios de Meta (lote) y los da de alta en el CRM como compradores por inmueble.
// Lo usa el script de Google (lee la planilla "Leads CIRE Inmobiliaria - Meta" cada 10 minutos) y la importación inicial.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const { data: token } = await sb.rpc("crm_secreto", { p_nombre: "agenda_token" });
  if (!token || req.headers.get("x-agenda-token") !== token) return new Response("no", { status: 401 });
  const { leads } = await req.json().catch(() => ({ leads: [] }));
  const res: Record<string, number> = { nuevo: 0, repetido: 0, existente: 0, error: 0 };
  for (const l of (leads || []).slice(0, 1000)) {
    const { data, error } = await sb.rpc("crm_alta_lead_meta", { p: l });
    if (error) { res.error++; if (res.error < 3) console.error(error.message); } else res[data as string] = (res[data as string] || 0) + 1;
  }
  return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json" } });
});
