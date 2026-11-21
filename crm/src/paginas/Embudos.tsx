import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EMBUDOS, UNIDADES, supabase } from "../config";
import { puedeOperar, useYo } from "../main";
import Temperatura, { hace, nivelTemp } from "../componentes/Temperatura";
import Registro, { type ContextoRegistro } from "../componentes/Registro";

export default function Embudos() {
  const yo = useYo();
  const nav = useNavigate();
  const inicial = EMBUDOS.find((e) => puedeOperar(yo, e.unidad))?.id || EMBUDOS[0].id;
  const [embudoId, setEmbudoId] = useState(inicial);
  const [verCerradas, setVerCerradas] = useState(false);
  const [soloMios, setSoloMios] = useState(false);
  const [temp, setTemp] = useState("");
  const [q, setQ] = useState("");
  const [rels, setRels] = useState<any[]>([]);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [registro, setRegistro] = useState<ContextoRegistro | null>(null);
  const emb = EMBUDOS.find((e) => e.id === embudoId)!;
  const puede = puedeOperar(yo, emb.unidad);

  const cargar = () =>
    supabase.from("crm_vista_relaciones").select("*").eq("embudo", embudoId).limit(5000).then(({ data }) => setRels(data || []));
  useEffect(() => { cargar(); }, [embudoId]);

  const mover = async (id: string, etapa: string) => {
    const r = rels.find((x) => x.id === id);
    if (!r || r.etapa === etapa) return;
    setRels((prev) => prev.map((x) => (x.id === id ? { ...x, etapa, etapa_desde: new Date().toISOString() } : x)));
    const { error } = await supabase.from("crm_relations").update({ etapa, estado: ["descartado", "perdido"].includes(etapa) ? "descartado" : ["cliente", "invirtio", "cerrado"].includes(etapa) ? "cliente_activo" : "prospecto", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { alert("No tenés permiso para operar esta unidad."); return cargar(); }
    await supabase.from("crm_activities").insert({ contact_id: r.contact_id, unidad: r.unidad, tipo: "cambio_etapa", autor: yo.clave, detalle: { de: r.etapa, a: etapa, embudo: embudoId } });
  };

  const etapas = emb.etapas.filter((e) => verCerradas || !e.cierre);
  const vis = useMemo(() => rels.filter((r) =>
    (!soloMios || r.responsable === yo.clave) && (!temp || nivelTemp(r.temperatura) === temp) && (!q || r.nombre?.toLowerCase().includes(q.toLowerCase()) || r.barrio?.toLowerCase().includes(q.toLowerCase()))
  ), [rels, soloMios, temp, q]);
  const dias = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);

  return (
    <>
      <div className="cabecera">
        <div><h1>Embudos</h1><p className="sub">{puede ? "Arrastrá las tarjetas entre etapas." : "Solo lectura: no operás esta unidad."} Ordenadas por temperatura.</p></div>
      </div>
      <div className="filtros">
        <select value={embudoId} onChange={(e) => setEmbudoId(e.target.value)}>
          {EMBUDOS.map((e) => <option key={e.id} value={e.id}>{UNIDADES[e.unidad]} · {e.nombre}</option>)}
        </select>
        <input type="search" placeholder="Buscar nombre o barrio" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="segmentos">
          {[["", "Todas"], ["caliente", "🔥 Calientes"], ["tibia", "Tibias"], ["fria", "Frías"]].map(([k, v]) => <button key={k} className={temp === k ? "activo" : ""} onClick={() => setTemp(k)}>{v}</button>)}
        </div>
        <label className="fila chico"><input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} /> Solo míos</label>
        <label className="fila chico"><input type="checkbox" checked={verCerradas} onChange={(e) => setVerCerradas(e.target.checked)} /> Ver cierres</label>
      </div>
      <div className="kanban">
        {etapas.map((et) => {
          const cartas = vis.filter((r) => r.etapa === et.id).sort((a, b) => b.temperatura - a.temperatura);
          return (
            <div key={et.id} className={`columna ${sobre === et.id ? "sobre" : ""} ${et.cierre ? "cierre" : ""}`}
              onDragOver={(e) => { if (puede) { e.preventDefault(); setSobre(et.id); } }}
              onDragLeave={() => setSobre(null)}
              onDrop={(e) => { e.preventDefault(); setSobre(null); if (arrastrando) mover(arrastrando, et.id); setArrastrando(null); }}>
              <h3><span>{et.nombre}</span><span className="contador">{cartas.length}</span></h3>
              {cartas.slice(0, 60).map((r) => {
                const d = dias(r.etapa_desde || r.created_at);
                const estanc = !et.cierre && et.id !== "nuevo" && (!r.ultima_gestion || Date.now() - +new Date(r.ultima_gestion) > 7 * 864e5);
                return (
                  <div key={r.id} className={`carta ${nivelTemp(r.temperatura)} ${estanc ? "estancada" : ""}`} draggable={puede}
                    onDragStart={() => setArrastrando(r.id)} onDragEnd={() => setArrastrando(null)}>
                    <div className="carta-cab">
                      <strong onClick={() => nav(`/contactos/${r.contact_id}`)}>{r.nombre}</strong>
                      <Temperatura t={r.temperatura} />
                    </div>
                    <div className="carta-meta">
                      {r.situacion && <span className="chip">{r.situacion}</span>}
                      {r.urgencia_form && <span className="chip">{r.urgencia_form}</span>}
                      {r.capital && <span className="chip">{r.capital}</span>}
                      {r.semaforo_desc && <span className={`chip sem-${r.semaforo_desc}`}>{r.semaforo_desc}</span>}
                    </div>
                    <div className="carta-pie">
                      <span>{r.barrio || "—"}</span>
                      <span className={d > 14 && !et.cierre ? "alerta" : ""}>{d} d en etapa</span>
                    </div>
                    {r.proximo_paso && <div className="carta-prox">→ {r.proximo_paso}</div>}
                    {estanc && <div className="carta-alerta">Sin gestión {hace(r.ultima_gestion)}</div>}
                    {puede && <button className="chico carta-btn" onClick={() => setRegistro({ contactId: r.contact_id, nombre: r.nombre, telefono: r.telefono, relaciones: [{ id: r.id, unidad: r.unidad, embudo: r.embudo }] })}>Registrar gestión</button>}
                  </div>
                );
              })}
              {cartas.length > 60 && <small className="sub">+{cartas.length - 60} más: filtrá por temperatura o barrio</small>}
            </div>
          );
        })}
      </div>
      {registro && <Registro ctx={registro} alCerrar={(c) => { setRegistro(null); if (c) cargar(); }} />}
    </>
  );
}
