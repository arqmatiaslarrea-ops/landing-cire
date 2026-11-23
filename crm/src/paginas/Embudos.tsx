import Descartar from "../componentes/Descartar";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EMBUDOS, PROXIMO_HITO, UNIDADES, supabase } from "../config";
import { puedeOperar, useMarca, useYo } from "../main";
import Temperatura, { hace, nivelTemp } from "../componentes/Temperatura";
import Registro, { type ContextoRegistro } from "../componentes/Registro";

export default function Embudos() {
  const yo = useYo();
  const [limite, setLimite] = useState<Record<string, number>>({});
  const [params] = useSearchParams();
  const inicial = (params.get("embudo") && EMBUDOS.some((e) => e.id === params.get("embudo")) ? params.get("embudo")! : null) || EMBUDOS.find((e) => puedeOperar(yo, e.unidad))?.id || EMBUDOS[0].id;
  const [embudoId, setEmbudoId] = useState(inicial);
  useMarca(EMBUDOS.find((e) => e.id === embudoId)?.unidad.startsWith("ranka") ? "ranka" : null);
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

  // Compradores: lo que importa es el inmueble que consultaron y si están listos, no los datos de vendedor
  const [meta, setMeta] = useState<Record<string, any>>({});
  const cargar = async () => {
    const { data } = await supabase.from("crm_vista_relaciones").select("*").eq("embudo", embudoId).limit(5000);
    setRels(data || []);
    if (embudoId === "compradores") {
      const filas: any[] = [];
      for (let d = 0; ; d += 1000) {
        const { data: m } = await supabase.from("crm_leads_meta").select("relation_id,inmueble,etapa_compra,capital,interes_visita,creado").order("creado").range(d, d + 999);
        filas.push(...(m || [])); if (!m || m.length < 1000) break;
      }
      setMeta(Object.fromEntries(filas.map((m) => [m.relation_id, m])));
    } else setMeta({});
  };
  const esComprador = embudoId === "compradores";
  const puntaje = (r: any) => {
    if (!esComprador) return r.temperatura;
    const m = meta[r.id]; if (!m) return 0;
    return (/listo/i.test(m.etapa_compra || "") ? 2 : 0) + (/capital|contado|listo/i.test(m.capital || "") ? 2 : /financ/i.test(m.capital || "") ? 1 : 0) + (/visit|asesor/i.test(m.interes_visita || "") ? 1 : 0);
  };
  const INM: Record<string, string> = { amenabar: "Amenábar", mitre: "Mitre", bogota: "Bogotá", acoyte: "Acoyte", honorio: "Honorio Pueyrredón", gaona: "Gaona" };
  const oracion = (t?: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");
  useEffect(() => { cargar(); setTemp(""); }, [embudoId]);

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
        <div><h1>Embudos</h1><p className="sub">{puede ? "Arrastrá las tarjetas entre etapas." : "Solo lectura: no operás esta unidad."} {esComprador ? " Primero los listos para comprar y con capital." : " Ordenadas por temperatura."}</p>{esComprador && <p className="embudo-aviso">Para escribirles por inmueble con el mensaje y la secuencia armados, usá <Link to="/compradores">Compradores</Link>.</p>}</div>
      </div>
      <div className="filtros">
        <select value={embudoId} onChange={(e) => setEmbudoId(e.target.value)}>
          {EMBUDOS.map((e) => <option key={e.id} value={e.id}>{UNIDADES[e.unidad]} · {e.nombre}</option>)}
        </select>
        <input type="search" placeholder="Buscar nombre o barrio" value={q} onChange={(e) => setQ(e.target.value)} />
        {!esComprador && <div className="segmentos">
          {[["", "Todas"], ["caliente", "🔥 Calientes"], ["tibia", "Tibias"], ["fria", "Frías"]].map(([k, v]) => <button key={k} className={temp === k ? "activo" : ""} onClick={() => setTemp(k)}>{v}</button>)}
        </div>}
        <label className="fila chico"><input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} /> Solo míos</label>
        <label className="fila chico"><input type="checkbox" checked={verCerradas} onChange={(e) => setVerCerradas(e.target.checked)} /> Ver cierres</label>
      </div>
      <div className="kanban">
        {etapas.map((et) => {
          const cartas = vis.filter((r) => r.etapa === et.id).sort((a, b) => puntaje(b) - puntaje(a) || +new Date(b.created_at) - +new Date(a.created_at));
          return (
            <div key={et.id} className={`columna ${sobre === et.id ? "sobre" : ""} ${et.cierre ? "cierre" : ""}`}
              onDragOver={(e) => { if (puede) { e.preventDefault(); setSobre(et.id); } }}
              onDragLeave={() => setSobre(null)}
              onDrop={(e) => { e.preventDefault(); setSobre(null); if (arrastrando) mover(arrastrando, et.id); setArrastrando(null); }}>
              <h3><span>{et.nombre}</span><span className="contador">{cartas.length}</span></h3>
              {!et.cierre && PROXIMO_HITO[embudoId]?.[et.id] && <p className="columna-hito">{PROXIMO_HITO[embudoId][et.id]}</p>}
              {cartas.slice(0, limite[et.id] || 20).map((r) => {
                const d = dias(r.etapa_desde || r.created_at);
                const estanc = !et.cierre && et.id !== "nuevo" && (!r.ultima_gestion || Date.now() - +new Date(r.ultima_gestion) > 7 * 864e5);
                const corto = (t?: string) => (t || "").replace(/\s*\(.*\)\s*$/, "");
                const inm = esComprador ? "" : [r.inm_direccion, r.inm_m2 && `${String(r.inm_m2).replace(/\s*m2|\s*m²/i, "")} m²`, r.inm_precio && !/no especif/i.test(r.inm_precio) && r.inm_precio].filter(Boolean).join(" · ");
                const siguiente = r.proximo_paso;
                const m = esComprador ? meta[r.id] : null;
                return (
                  <div key={r.id} className={`carta ${nivelTemp(r.temperatura)} ${estanc ? "estancada" : ""}`} draggable={puede}
                    onDragStart={() => setArrastrando(r.id)} onDragEnd={() => setArrastrando(null)}>
                    <div className="carta-cab">
                      <Link to={`/contactos/${r.contact_id}`} className="carta-nombre">{r.nombre}</Link>
                      {esComprador ? (puntaje(r) >= 4 ? <span className="chip listo">Listo</span> : null) : <Temperatura t={r.temperatura} />}
                    </div>
                    {esComprador ? (
                      <>
                        {m && <div className="carta-inm">Consultó por {INM[m.inmueble] || m.inmueble}</div>}
                        {m && (m.etapa_compra || m.capital || m.interes_visita) && (
                          <div className="carta-meta">
                            {[...new Set([m.etapa_compra, m.capital, m.interes_visita].filter(Boolean))].map((t: any) => <span key={t} className="chip" title={oracion(t)}>{oracion(corto(t))}</span>)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {inm && <div className="carta-inm" title={inm}>{inm}</div>}
                        {(r.situacion || r.urgencia_form || r.capital || r.semaforo_desc) && (
                          <div className="carta-meta">
                            {r.semaforo_desc && <span className={`chip sem-${r.semaforo_desc}`}>{r.semaforo_desc}</span>}
                            {r.situacion && <span className="chip">{corto(r.situacion)}</span>}
                            {r.urgencia_form && /urgente/i.test(r.urgencia_form) && <span className="chip urgente">Urgente</span>}
                            {r.capital && <span className="chip">{corto(r.capital)}</span>}
                          </div>
                        )}
                      </>
                    )}
                    {siguiente && <div className="carta-prox" title={siguiente}>{siguiente}</div>}
                    <div className="carta-pie">
                      <span>{esComprador ? `Entró ${m?.creado ? new Date(m.creado).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}` : r.inm_barrio || r.barrio || "Sin barrio"}</span>
                      <span className={estanc ? "alerta" : d > 14 && !et.cierre ? "alerta" : ""}>{estanc ? `Sin gestión ${hace(r.ultima_gestion)}` : `${d} d en etapa`}</span>
                    </div>
                    {puede && (
                      <div className="carta-acc">
                        <button className="chico" onClick={() => setRegistro({ contactId: r.contact_id, nombre: r.nombre, telefono: r.telefono, relaciones: [{ id: r.id, unidad: r.unidad, embudo: r.embudo }] })}>Registrar</button>
                        <select className="chico" aria-label="Mover a otra etapa" value={r.etapa} onChange={(e) => mover(r.id, e.target.value)}>
                          {etapas.map((x) => <option key={x.id} value={x.id}>{x.id === r.etapa ? "Mover a…" : x.nombre}</option>)}
                        </select>
                        {!et.cierre && <Descartar relationId={r.id} nombre={r.nombre.split(" ")[0]} alCambiar={cargar} />}
                      </div>
                    )}
                  </div>
                );
              })}
              {cartas.length > (limite[et.id] || 20) && <button className="chico ver-mas" onClick={() => setLimite({ ...limite, [et.id]: (limite[et.id] || 20) + 30 })}>Ver {Math.min(30, cartas.length - (limite[et.id] || 20))} más de {cartas.length}</button>}
            </div>
          );
        })}
      </div>
      {registro && <Registro ctx={registro} alCerrar={(c) => { setRegistro(null); if (c) cargar(); }} />}
    </>
  );
}
