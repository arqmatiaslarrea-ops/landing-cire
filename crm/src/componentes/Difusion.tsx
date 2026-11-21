import { useEffect, useMemo, useState } from "react";
import { supabase, usd, waLink } from "../config";

// Difusión de una propiedad a las inmobiliarias del barrio (y barrios que elijas), con mensaje armado.
// El mensaje no incluye la dirección exacta ni datos del vendedor: eso se comparte recién con quien responde.
export default function Difusion({ p }: { p: any }) {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set());
  const [barrios, setBarrios] = useState<string[]>(p.barrio ? [p.barrio] : []);
  const [extra, setExtra] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (!abierto) return;
    supabase.from("crm_difusiones").select("organizacion_id").eq("propiedad_id", p.id).then(({ data }) => setEnviadas(new Set((data || []).map((d: any) => d.organizacion_id))));
    if (!barrios.length) { setOrgs([]); return; }
    supabase.from("crm_organizaciones").select("id,nombre,barrio,whatsapp,telefono,email,estado_contacto").in("barrio", barrios).neq("estado_contacto", "no_interesa").order("nombre").limit(1000)
      .then(({ data }) => setOrgs(data || []));
  }, [abierto, barrios.join("|"), p.id]);

  useEffect(() => {
    const partes = [
      p.tipo ? p.tipo.replace("_", " ").toUpperCase() : "PROPIEDAD",
      p.ambientes ? `${p.ambientes} amb.` : null,
      p.m2_totales || p.m2_cubiertos ? `${p.m2_totales || p.m2_cubiertos} m²` : null,
      p.barrio ? `en ${p.barrio}` : null,
    ].filter(Boolean).join(" ");
    const precio = p.precio_operacion_usd || p.precio_pedido_usd;
    setTexto(`Hola, ¿cómo están? Soy Matías Larrea de CIRE. Tenemos para compartir: ${partes}${p.estado_fisico ? `, ${p.estado_fisico.replace(/_/g, " ")}` : ""}${precio ? `. Valor ${usd(precio)}` : ""}. Compartimos honorarios. Si tienen un comprador o inversor interesado, les paso la ficha completa.`);
  }, [p]);

  const conWa = useMemo(() => orgs.filter((o) => o.whatsapp || o.telefono), [orgs]);
  const pendientes = conWa.filter((o) => !enviadas.has(o.id));

  const registrar = async (o: any, canal: string) => {
    setEnviadas((s) => new Set(s).add(o.id));
    await supabase.from("crm_difusiones").insert({ propiedad_id: p.id, organizacion_id: o.id, canal, motivo: "difusion" });
    if (!o.estado_contacto || o.estado_contacto === "sin_contactar") await supabase.from("crm_organizaciones").update({ estado_contacto: "contactada", ultimo_contacto: new Date().toISOString().slice(0, 10) }).eq("id", o.id);
  };

  return (
    <div className="tarjeta" style={{ marginTop: 16 }}>
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Difundir a inmobiliarias</h2>
        <button className="chico" onClick={() => setAbierto(!abierto)}>{abierto ? "Cerrar" : "Armar difusión"}</button>
      </div>
      {!abierto && <p className="sub chico">Manda la propiedad a las inmobiliarias del barrio con un mensaje listo y registra a quién le llegó.</p>}
      {abierto && (
        <>
          <div className="fila" style={{ margin: "10px 0" }}>
            {barrios.map((b) => <span key={b} className="chip">{b} <button className="link" aria-label={`Quitar ${b}`} onClick={() => setBarrios(barrios.filter((x) => x !== b))}>✕</button></span>)}
            <input placeholder="Sumar barrio (ej. Coghlan)" value={extra} onChange={(e) => setExtra(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && extra.trim()) { setBarrios([...new Set([...barrios, extra.trim()])]); setExtra(""); } }} style={{ width: 200 }} />
          </div>
          <label className="campo chico">Mensaje (sin dirección exacta ni datos del vendedor)<textarea rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
          <p className="sub chico">{conWa.length} inmobiliarias con teléfono en {barrios.join(", ") || "—"} · {conWa.length - pendientes.length} ya recibieron esta propiedad · {pendientes.length} pendientes</p>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {conWa.map((o) => {
              const wa = waLink(o.whatsapp || o.telefono, texto);
              const ya = enviadas.has(o.id);
              return (
                <div className="item" key={o.id} style={{ opacity: ya ? 0.55 : 1 }}>
                  <div className="item-txt"><span className="item-nombre">{o.nombre}</span><small className="sub">{o.barrio}{ya ? " · enviada" : ""}</small></div>
                  <div className="item-acc">
                    {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => registrar(o, "whatsapp")}><button className="chico">{ya ? "Reenviar" : "WhatsApp"}</button></a>}
                    {o.email && <a href={`mailto:${o.email}?subject=${encodeURIComponent("Propiedad para compartir - CIRE")}&body=${encodeURIComponent(texto)}`} onClick={() => registrar(o, "email")}><button className="chico">Mail</button></a>}
                  </div>
                </div>
              );
            })}
            {!conWa.length && <p className="sub">No hay inmobiliarias con teléfono en esos barrios. Sumá barrios vecinos.</p>}
          </div>
          <p className="sub chico">De a 15 o 20 por día, en horario laboral y con el mensaje adaptado, para no arriesgar el número de WhatsApp.</p>
        </>
      )}
    </div>
  );
}
