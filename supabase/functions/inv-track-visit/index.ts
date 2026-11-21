import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const b = await req.json().catch(() => ({}));
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await sb.from("inv_site_visits").insert({
      session_id: String(b.session_id || "").slice(0, 100) || null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
      referrer: String(b.referrer || "").slice(0, 500) || null,
      path: String(b.path || "/").slice(0, 200),
    });
  } catch (e) { console.error(e); }
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
});
