import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pass",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const passphrase = req.headers.get("x-admin-pass");
  const expected = Deno.env.get("ADMIN_PASSPHRASE");
  if (!expected || passphrase !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [v7, v30, lAll, l7, lByType, recent] = await Promise.all([
      sb.from("inv_site_visits").select("id", { count: "exact", head: true }).gte("created_at", since7),
      sb.from("inv_site_visits").select("id", { count: "exact", head: true }).gte("created_at", since30),
      sb.from("inv_leads").select("id", { count: "exact", head: true }),
      sb.from("inv_leads").select("id", { count: "exact", head: true }).gte("created_at", since7),
      sb.from("inv_leads").select("tipo_lead"),
      sb.from("inv_leads").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    const byType: Record<string, number> = {};
    (lByType.data || []).forEach((r: any) => {
      byType[r.tipo_lead] = (byType[r.tipo_lead] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        visits_7d: v7.count || 0,
        visits_30d: v30.count || 0,
        leads_total: lAll.count || 0,
        leads_7d: l7.count || 0,
        leads_by_type: byType,
        conversion_7d: v7.count ? ((l7.count || 0) / v7.count * 100).toFixed(2) + "%" : "N/A",
        recent_leads: recent.data || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("admin-stats error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
