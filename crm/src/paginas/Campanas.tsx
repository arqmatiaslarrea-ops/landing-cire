import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, usd } from "../config";
import { useYo } from "../main";

// Lectura de campañas: leads por campaña, conjunto y anuncio, calidad de cada uno y comparación de indicadores.
type Fila = { clave: string; campana: string; conjunto: string; anuncio: string; inmueble: string; leads: any[] };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const listo = (l: any) => /listo/i.test(l.etapa_compra || "");
const capital = (l: any) => /listo/i.test(l.capital || "");
const visita = (l: any) => /visita/i.test(l.interes_visita || "");

export default function Campanas() {
  const yo = useYo();
  const [leads, setLeads] = useState<any[]>([]);
  const [gasto, setGasto] = useState<Record<string, any>>({});
  const [rels, setRels] = useState<Record<string, any>>({});
  const [nivel, setNivel] = useState<"conjunto" | "anuncio">("anuncio");
  const [dias, setDias] = useState(90);
  const [orden, setOrden] = useState<"leads" | "calidad" | "cpl" | "avance">("leads");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [comparar, setComparar] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [l, g] = await Promise.all([
        supabase.from("crm_leads_meta").select("*").order("creado", { ascending: false }).limit(5000),
        supabase.from("crm_campanas_gasto").select("*"),
      ]);
      setLeads(l.data || []); setGasto(Object.fromEntries((g.data || []).map((x: any) => [x.conjunto, x])));
      const ids = [...new Set((l.data || []).map((x: any) => x.relation_id).filter(Boolean))];
      const mapa: Record<string, any> = {};
      for (let k = 0; k < ids.length; k += 300) {
        const { data } = await supabase.from("crm_relations").select("id,etapa,estado").in("id", ids.slice(k, k + 300));
        (data || []).forEach((r: any) => { mapa[r.id] = r; });
      }
      setRels(mapa);
    })();
  }, []);

  const filas: Fila[] = useMemo(() => {
    const desde = Date.now() - dias * 864e5;
    const m = new Map<string, Fila>();
    leads.filter((l) => +new Date(l.creado) >= desde).forEach((l) => {
      const conj = l.conjunto || "Sin dato de campaña (leads viejos)";
      const clave = nivel === "conjunto" ? conj : `${conj}||${l.anuncio || "Sin anuncio"}`;
      if (!m.has(clave)) m.set(clave, { clave, campana: l.campana || "—", conjunto: conj, anuncio: nivel === "anuncio" ? l.anuncio || "Sin anuncio" : "", inmueble: l.inmueble, leads: [] });
      m.get(clave)!.leads.push(l);
    });
    return [...m.values()];
  }, [leads, nivel, dias]);

  const kpi = (f: Fila) => {
    const n = f.leads.length;
    const avanzados = f.leads.filter((l) => !["nuevo", "contactado", undefined].includes(rels[l.relation_id]?.etapa) && rels[l.relation_id]?.estado !== "descartado").length;
    const descartados = f.leads.filter((l) => rels[l.relation_id]?.estado === "descartado").length;
    const g = nivel === "conjunto" ? gasto[f.conjunto]?.gasto_usd : null;
    return {
      n, listo: pct(f.leads.filter(listo).length, n), capital: pct(f.leads.filter(capital).length, n), visita: pct(f.leads.filter(visita).length, n),
      calidad: Math.round((pct(f.leads.filter(listo).length, n) + pct(f.leads.filter(capital).length, n) + pct(f.leads.filter(visita).length, n)) / 3),
      avance: pct(avanzados, n), descarte: pct(descartados, n),
      ig: pct(f.leads.filter((l) => l.plataforma === "ig").length, n),
      cpl: g ? Number(g) / n : null, gasto: g ?? null,
      ultimo: f.leads[0]?.creado,
    };
  };
  const ordenadas = [...filas].sort((a, b) => {
    const ka = kpi(a), kb = kpi(b);
    if (orden === "cpl") return (ka.cpl ?? 1e9) - (kb.cpl ?? 1e9);
    return (kb as any)[orden === "leads" ? "n" : orden] - (ka as any)[orden === "leads" ? "n" : orden];
  });
  const max = Math.max(1, ...filas.map((f) => f.leads.length));
  const cmp = filas.filter((f) => comparar.includes(f.clave));
  const guardarGasto = async (conjunto: string, valor: string) => {
    const v = valor ? Number(valor) : null;
    setGasto((g) => ({ ...g, [conjunto]: { ...g[conjunto], gasto_usd: v } }));
    await supabase.from("crm_campanas_gasto").upsert({ conjunto, gasto_usd: v, actualizado: new Date().toISOString() });
  };
  const total = filas.reduce((s, f) => s + f.leads.length, 0);

  return (
    <>
      <div className="cabecera">
        <div><h1>Campañas</h1><p className="sub">Cuántos leads trae cada conjunto y cada anuncio de Meta, de qué calidad y cuántos avanzan en el embudo. La calidad sale de las respuestas del formulario.</p></div>
      </div>
      <div className="filtros">
        <div className="segmentos">
          <button className={nivel === "anuncio" ? "activo" : ""} onClick={() => setNivel("anuncio")}>Por anuncio</button>
          <button className={nivel === "conjunto" ? "activo" : ""} onClick={() => setNivel("conjunto")}>Por conjunto</button>
        </div>
        <select value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período">
          {[[7, "Últimos 7 días"], [30, "Últimos 30 días"], [90, "Últimos 90 días"], [3650, "Todo"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as any)} aria-label="Ordenar">
          <option value="leads">Ordenar por leads</option><option value="calidad">Por calidad</option><option value="avance">Por avance en el embudo</option><option value="cpl">Por costo por lead</option>
        </select>
        <span className="sub">{total} leads · {filas.length} {nivel === "anuncio" ? "anuncios" : "conjuntos"}</span>
      </div>

      {cmp.length >= 2 && (
        <div className="tarjeta panel">
          <div className="fila" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Comparación</h2><button className="link chico" onClick={() => setComparar([])}>Limpiar</button></div>
          <div className="tabla-scroll"><table>
            <thead><tr><th>Indicador</th>{cmp.map((f) => <th key={f.clave}>{nivel === "anuncio" ? f.anuncio : f.conjunto}</th>)}</tr></thead>
            <tbody>
              {([["Leads", "n", ""], ["Listos para comprar", "listo", "%"], ["Con capital propio", "capital", "%"], ["Quieren visitar", "visita", "%"], ["Calidad (promedio)", "calidad", "%"], ["Avanzaron en el embudo", "avance", "%"], ["Descartados", "descarte", "%"], ["Desde Instagram", "ig", "%"]] as const).map(([t, k, u]) => {
                const vals = cmp.map((f) => (kpi(f) as any)[k] as number);
                const mejor = k === "descarte" ? Math.min(...vals) : Math.max(...vals);
                return <tr key={k}><td>{t}</td>{vals.map((v, i) => <td key={i} className={v === mejor ? "mejor" : ""}>{v}{u}</td>)}</tr>;
              })}
              {nivel === "conjunto" && <tr><td>Costo por lead</td>{cmp.map((f) => <td key={f.clave}>{kpi(f).cpl != null ? usd(Math.round(kpi(f).cpl!)) : "Cargá el gasto"}</td>)}</tr>}
            </tbody>
          </table></div>
        </div>
      )}

      <div className="tabla-scroll">
        <table className="tabla-campanas">
          <thead><tr><th></th><th>{nivel === "anuncio" ? "Anuncio" : "Conjunto"}</th><th>Leads</th><th>Listos</th><th>Capital propio</th><th>Quieren visitar</th><th>Avanzaron</th>{nivel === "conjunto" && <th>Gasto USD</th>}{nivel === "conjunto" && <th>Costo por lead</th>}<th>Último</th></tr></thead>
          <tbody>
            {ordenadas.map((f) => {
              const k = kpi(f);
              return (
                <Fragment key={f.clave}>
                  <tr className="clic" onClick={() => setAbierto(abierto === f.clave ? null : f.clave)}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Comparar" checked={comparar.includes(f.clave)} onChange={(e) => setComparar(e.target.checked ? [...comparar, f.clave].slice(-4) : comparar.filter((x) => x !== f.clave))} /></td>
                    <td><strong>{nivel === "anuncio" ? f.anuncio : f.conjunto}</strong><br /><small className="sub">{nivel === "anuncio" ? f.conjunto : f.campana}</small></td>
                    <td style={{ minWidth: 120 }}><div className="barra" style={{ margin: "0 0 2px" }}><i style={{ width: `${(k.n / max) * 100}%` }} /></div><b>{k.n}</b></td>
                    <td>{k.listo}%</td><td>{k.capital}%</td><td>{k.visita}%</td><td>{k.avance}%</td>
                    {nivel === "conjunto" && <td onClick={(e) => e.stopPropagation()}>{yo.admin ? <input type="number" style={{ width: 90 }} defaultValue={k.gasto ?? ""} onBlur={(e) => guardarGasto(f.conjunto, e.target.value)} /> : k.gasto ?? "—"}</td>}
                    {nivel === "conjunto" && <td>{k.cpl != null ? usd(Math.round(k.cpl)) : "—"}</td>}
                    <td><small>{k.ultimo ? new Date(k.ultimo).toLocaleDateString("es-AR") : "—"}</small></td>
                  </tr>
                  {abierto === f.clave && (
                    <tr><td colSpan={nivel === "conjunto" ? 10 : 8} style={{ background: "#f6f8f7" }}>
                      <div className="campana-leads">
                        {f.leads.map((l) => <Link key={l.lead_id} to={`/contactos/${l.contact_id}`} className="chip">{l.nombre || "Sin nombre"}{rels[l.relation_id]?.estado === "descartado" ? " · descartado" : ""}</Link>)}
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sub chico" style={{ marginTop: 10 }}>Tildá hasta 4 filas para compararlas. El gasto, las impresiones y los clics se cargan a mano por conjunto hasta conectar la API de anuncios de Meta; con eso el costo por lead se calcula solo.</p>
    </>
  );
}
