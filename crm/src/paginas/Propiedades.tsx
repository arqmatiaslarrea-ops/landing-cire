import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, usd } from "../config";
import { puedeOperar, useYo } from "../main";
import { ESTRATEGIAS, ETAPAS_PROP, analisis, type Propiedad } from "../negocio";

export default function Propiedades() {
  const yo = useYo();
  const nav = useNavigate();
  const puede = puedeOperar(yo, "inmobiliaria") || puedeOperar(yo, "desarrolladora");
  const [props, setProps] = useState<(Propiedad & { ultima_oferta?: number | null; ofertas?: number })[]>([]);
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState("");
  const [estr, setEstr] = useState("");
  const [vista, setVista] = useState<"tabla" | "tablero">("tablero");

  useEffect(() => {
    (async () => {
      const [p, o] = await Promise.all([
        supabase.from("crm_propiedades").select("*").order("updated_at", { ascending: false }),
        supabase.from("crm_ofertas").select("propiedad_id,monto_usd,fecha").order("fecha", { ascending: false }),
      ]);
      const ofs = o.data || [];
      setProps((p.data || []).map((x: any) => {
        const mias = ofs.filter((y: any) => y.propiedad_id === x.id);
        return { ...x, ultima_oferta: mias[0]?.monto_usd ?? null, ofertas: mias.length };
      }));
    })();
  }, []);

  const vis = useMemo(() => props.filter((p) =>
    (!q || [p.direccion, p.barrio].some((v) => v?.toLowerCase().includes(q.toLowerCase()))) && (!etapa || p.etapa_loacc === etapa) && (!estr || p.estrategia === estr)
  ), [props, q, etapa, estr]);

  const nueva = async () => {
    const direccion = prompt("Dirección de la propiedad");
    if (!direccion) return;
    const { data, error } = await supabase.from("crm_propiedades").insert({ direccion, responsable: yo.clave, prospecto_por: yo.clave }).select("id").single();
    if (error) return alert(error.message);
    nav(`/propiedades/${data.id}`);
  };

  return (
    <>
      <div className="cabecera">
        <div><h1>Propiedades</h1><p className="sub">Cada inmueble con su vendedor, sus ofertas, el análisis del negocio y los inversores posibles.</p></div>
        <div className="fila">
          <div className="segmentos"><button className={vista === "tablero" ? "activo" : ""} onClick={() => setVista("tablero")}>Tablero LOACC</button><button className={vista === "tabla" ? "activo" : ""} onClick={() => setVista("tabla")}>Lista</button></div>
          {puede && <button className="primario" onClick={nueva}>+ Nueva propiedad</button>}
        </div>
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar dirección o barrio" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={estr} onChange={(e) => setEstr(e.target.value)}><option value="">Todas las estrategias</option>{Object.entries(ESTRATEGIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        {vista === "tabla" && <select value={etapa} onChange={(e) => setEtapa(e.target.value)}><option value="">Todas las etapas</option>{Object.entries(ETAPAS_PROP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
      </div>

      {vista === "tablero" ? (
        <div className="kanban">
          {Object.entries(ETAPAS_PROP).map(([k, v]) => {
            const cs = vis.filter((p) => p.etapa_loacc === k);
            return (
              <div className={`columna ${k === "X" ? "cierre" : ""}`} key={k}>
                <h3><span>{v}</span><span className="contador">{cs.length}</span></h3>
                {cs.map((p) => {
                  const a = analisis(p, p.ultima_oferta ?? null);
                  return (
                    <div className="carta" key={p.id} onClick={() => nav(`/propiedades/${p.id}`)} style={{ cursor: "pointer" }}>
                      <div className="carta-cab"><strong>{p.direccion}</strong></div>
                      <div className="carta-meta"><span className="chip">{ESTRATEGIAS[p.estrategia]}</span>{p.situacion && <span className="chip">{p.situacion}</span>}</div>
                      <div className="carta-pie"><span>{p.barrio || "—"}</span><span>{p.ultima_oferta ? `Oferta ${usd(p.ultima_oferta)}` : p.precio_pedido_usd ? `Pide ${usd(p.precio_pedido_usd)}` : ""}</span></div>
                      {a.mao != null && <div className="carta-prox">Oferta máx. {usd(a.mao)}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Propiedad</th><th>Etapa</th><th>Estrategia</th><th>Pide</th><th>Última oferta</th><th>Oferta máx.</th><th>Ganancia proyectada</th></tr></thead>
            <tbody>
              {vis.map((p) => {
                const a = analisis(p, p.ultima_oferta ?? null);
                return (
                  <tr key={p.id} className="clic" onClick={() => nav(`/propiedades/${p.id}`)}>
                    <td><strong>{p.direccion}</strong><br /><small className="sub">{p.barrio}</small></td>
                    <td>{ETAPAS_PROP[p.etapa_loacc]}</td>
                    <td>{ESTRATEGIAS[p.estrategia]}</td>
                    <td>{usd(p.precio_pedido_usd)}</td>
                    <td>{usd(p.ultima_oferta)} {p.ofertas && p.ofertas > 1 ? <small className="sub">({p.ofertas})</small> : null}</td>
                    <td>{a.mao != null ? usd(a.mao) : <small className="sub">falta análisis</small>}</td>
                    <td>{a.ganancia != null ? usd(a.ganancia) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
