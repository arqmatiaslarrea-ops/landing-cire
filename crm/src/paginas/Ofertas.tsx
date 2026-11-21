import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ESTADOS_OFERTA, LOACC, etiqueta, fecha, supabase, usd } from "../config";
import { puedeOperar, useYo } from "../main";
import { metaPlan260 } from "./Inicio";

const CARPETA = "https://drive.google.com/drive/folders/1k-ufFplHLOBMDrXdQbBbCEDWBVQ-7xSd";
const PLANTILLA = "https://docs.google.com/document/d/1EjkWPgxlH8iV1EzK0wiJXZLtKp2tCXHPXT1TvG90Aeg/edit";

export default function Ofertas() {
  const yo = useYo();
  const puede = puedeOperar(yo, "inmobiliaria") || puedeOperar(yo, "desarrolladora");
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("abiertas");
  const [nueva, setNueva] = useState<any | null>(null);

  const cargar = () => supabase.from("crm_ofertas").select("*").order("fecha", { ascending: false }).then(({ data }) => setOfertas(data || []));
  useEffect(() => { cargar(); }, []);

  const actualizar = async (o: any, cambios: any) => {
    const { error } = await supabase.from("crm_ofertas").update(cambios).eq("id", o.id);
    if (error) alert("No tenés permiso para editar ofertas."); else cargar();
  };
  const guardarNueva = async () => {
    const { error } = await supabase.from("crm_ofertas").insert({ ...nueva, monto_usd: Number(nueva.monto_usd), responsable: yo.clave });
    if (error) return alert(error.message);
    setNueva(null); cargar();
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const abiertas = (o: any) => !["rechazada", "vencida", "cerrada"].includes(o.estado);
  const vis = ofertas.filter((o) => filtro === "todas" || (filtro === "abiertas" ? abiertas(o) : o.cuenta_plan_260));
  const plan = ofertas.filter((o) => o.cuenta_plan_260);
  const meta = metaPlan260();
  const porEtapa = (id: string) => ofertas.filter((o) => o.etapa_loacc === id).length;

  return (
    <>
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <div><h1>Ofertas · Plan 260</h1><p className="sub">Toda oferta con número se registra acá y su documento vive en la carpeta de ofertas de Drive.</p></div>
        <div className="fila">
          <a href={PLANTILLA} target="_blank" rel="noreferrer"><button>Plantilla</button></a>
          <a href={CARPETA} target="_blank" rel="noreferrer"><button>Carpeta de Drive</button></a>
          {puede && <button className="primario" onClick={() => setNueva({ fecha: hoy, direccion: "", barrio: "", localidad: "CABA", monto_usd: "", estado: "enviada", etapa_loacc: "O", doc_url: "" })}>+ Registrar oferta</button>}
        </div>
      </div>

      <div className="grilla" style={{ marginBottom: 16 }}>
        <div className="tarjeta kpi">
          <div className="titulo">Plan 260 (desde el 5/10)</div>
          <div className="valor">{plan.length} <small>/ 260</small></div>
          <div className="barra"><i style={{ width: `${(plan.length / 260) * 100}%` }} /></div>
          <small>Meta del anotador a hoy: {meta} {plan.length < meta && <span className="alerta">· faltan {meta - plan.length}</span>}</small>
        </div>
        <div className="tarjeta kpi">
          <div className="titulo">Volumen ofertado (plan)</div>
          <div className="valor">{usd(plan.reduce((s, o) => s + Number(o.monto_usd), 0))}</div>
          <small>Promedio {usd(plan.length ? Math.round(plan.reduce((s, o) => s + Number(o.monto_usd), 0) / plan.length) : 0)}</small>
        </div>
        <div className="tarjeta kpi">
          <div className="titulo">Embudo LOACC</div>
          <div className="fila" style={{ marginTop: 8 }}>{LOACC.map((l) => <span key={l.id} className="chip">{l.nombre}: <b>{porEtapa(l.id)}</b></span>)}</div>
          <small>Hasta tener 3 semanas de muestra, anotar sin sacar conclusiones.</small>
        </div>
      </div>

      {nueva && (
        <div className="tarjeta" style={{ marginBottom: 14 }}>
          <div className="filtros">
            <input type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} />
            <input placeholder="Dirección *" value={nueva.direccion} onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })} />
            <input placeholder="Barrio" value={nueva.barrio} onChange={(e) => setNueva({ ...nueva, barrio: e.target.value })} />
            <input placeholder="Monto USD *" type="number" value={nueva.monto_usd} onChange={(e) => setNueva({ ...nueva, monto_usd: e.target.value })} />
            <input placeholder="Inmobiliaria (si hay)" value={nueva.inmobiliaria || ""} onChange={(e) => setNueva({ ...nueva, inmobiliaria: e.target.value })} />
            <input placeholder="Link al documento" value={nueva.doc_url} onChange={(e) => setNueva({ ...nueva, doc_url: e.target.value })} />
            <button className="primario" disabled={!nueva.direccion || !nueva.monto_usd} onClick={guardarNueva}>Guardar</button>
            <button onClick={() => setNueva(null)}>Cancelar</button>
          </div>
          <small className="sub">Las ofertas verbales con número también cuentan: registralas aunque no tengan documento.</small>
        </div>
      )}

      <div className="filtros">
        {["abiertas", "plan", "todas"].map((f) => <button key={f} className={filtro === f ? "primario" : ""} onClick={() => setFiltro(f)}>{f === "plan" ? "Plan 260" : etiqueta(f)}</button>)}
      </div>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Fecha</th><th>Propiedad</th><th>Monto</th><th>Vence</th><th>Estado</th><th>LOACC</th><th>Respuesta / contraoferta</th><th>Doc</th></tr></thead>
          <tbody>
            {vis.map((o) => (
              <tr key={o.id}>
                <td>{fecha(o.fecha + "T12:00")}</td>
                <td>{o.propiedad_id ? <Link to={`/propiedades/${o.propiedad_id}`}><strong>{o.direccion}</strong></Link> : <strong>{o.direccion}</strong>}<br /><small className="sub">{o.barrio}{o.inmobiliaria ? ` · ${o.inmobiliaria}` : ""}</small>{o.observaciones && <><br /><small className={o.observaciones.startsWith("ERROR") || o.observaciones.startsWith("ARCHIVO") ? "alerta" : "sub"}>{o.observaciones}</small></>}</td>
                <td>{usd(o.monto_usd)}</td>
                <td>{o.vence ? <span className={o.vence < hoy && abiertas(o) && o.estado === "enviada" ? "alerta" : ""}>{fecha(o.vence + "T12:00")}</span> : "—"}</td>
                <td><select disabled={!puede} value={o.estado} onChange={(e) => actualizar(o, { estado: e.target.value })}>{ESTADOS_OFERTA.map((s) => <option key={s} value={s}>{etiqueta(s)}</option>)}</select></td>
                <td><select disabled={!puede} value={o.etapa_loacc} onChange={(e) => actualizar(o, { etapa_loacc: e.target.value })}>{LOACC.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></td>
                <td><input disabled={!puede} defaultValue={o.respuesta || ""} placeholder="Qué respondió" onBlur={(e) => e.target.value !== (o.respuesta || "") && actualizar(o, { respuesta: e.target.value || null })} style={{ width: 160 }} />
                  <input disabled={!puede} type="number" defaultValue={o.contraoferta_usd || ""} placeholder="USD contraoferta" onBlur={(e) => actualizar(o, { contraoferta_usd: e.target.value ? Number(e.target.value) : null })} style={{ width: 120, marginTop: 4 }} /></td>
                <td>{o.doc_url ? <a href={o.doc_url} target="_blank" rel="noreferrer">Abrir</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
