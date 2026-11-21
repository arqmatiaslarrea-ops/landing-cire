// El lead completó el formulario pero no abrió WhatsApp en 5 minutos:
// se registra en su ficha del CRM para que el responsable lo llame.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const b = await req.json();
    const digits = String(b.leadPhone || "").replace(/\D/g, "");
    const norm = digits.length >= 10 ? digits.slice(-10) : digits;
    if (norm) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: c } = await sb.from("crm_contacts").select("id").eq("telefono_norm", norm).maybeSingle();
      if (c) {
        await sb.from("crm_activities").insert({ contact_id: c.id, unidad: "inmobiliaria", tipo: "sin_accion_post_formulario",
          detalle: { landing: "cireinmobiliaria.com", nota: "Completó el formulario y no abrió WhatsApp en 5 minutos. Llamar." } });
        await sb.from("crm_relations").update({ proximo_paso: "Llamar: no abrió WhatsApp tras el formulario", proximo_paso_fecha: new Date().toISOString() })
          .eq("contact_id", c.id).eq("embudo", "vendedores_motivados");
      }
    }
  } catch (e) { console.error(e); }
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
});
