import { useEffect, useState } from "react";
import { supabase, usd, waLink } from "../config";

// Plan de obra por propiedad: tareas por gremio, fechas, avance, gremio asignado y alertas.
export default function Obra({ propiedadId, puede }: { propiedadId: string; puede: boolean }) {
  const [tareas, setTareas] = useState<any[]>([]);
  const [gremios, setGremios] = useState<any[]>([]);
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");

  const cargar = () => supabase.from("crm_obra_tareas").select("*").eq("propiedad_id", propiedadId).order("orden").then(({ data }) => setTareas(data || []));
  useEffect(() => {
    cargar();
    supabase.from("crm_gremios").select("id,nombre,rubro,telefono").order("nombre").then(({ data }) => setGremios(data || []));
  }, [propiedadId]);

  const crear = async () => {
    const { error } = await supabase.rpc("crm_cargar_plantilla_obra", { p_propiedad: propiedadId, p_inicio: inicio });
    if (error) setMsg(error.message); else cargar();
  };
  const act = async (t: any, cambios: any) => {
    setTareas((l) => l.map((x) => (x.id === t.id ? { ...x, ...cambios } : x)));
    await supabase.from("crm_obra_tareas").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", t.id);
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const avance = tareas.length ? Math.round(tareas.reduce((s, t) => s + t.avance, 0) / tareas.length) : 0;
  const atrasadas = tareas.filter((t) => t.fin && t.fin < hoy && t.avance < 100);
  const proximas = tareas.filter((t) => t.inicio && t.inicio >= hoy && t.inicio <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) && !t.gremio_id);
  const presupuesto = tareas.reduce((s, t) => s + Number(t.presupuesto_usd || 0), 0);
  const fin = tareas.reduce((m, t) => (t.fin && t.fin > m ? t.fin : m), "");

  return (
    <div className="tarjeta" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Obra</h2>
      {!tareas.length ? (
        <>
          <p className="sub chico">Cargá el plan de obra estándar (20 tareas por gremio, desde permisos hasta la entrega) y ajustá fechas y gremios.</p>
          {puede && <div className="fila"><label className="campo chico" style={{ margin: 0 }}>Inicio de obra<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label><button className="primario" onClick={crear}>Cargar plan de obra</button></div>}
          {msg && <p className="aviso">{msg}</p>}
        </>
      ) : (
        <>
          <div className="metricas">
            <div><span>Avance general</span><b>{avance}%</b><small>promedio de tareas</small></div>
            <div><span>Fin previsto</span><b>{fin ? new Date(fin + "T12:00").toLocaleDateString("es-AR") : "—"}</b><small>según el plan</small></div>
            <div><span>Atrasadas</span><b className={atrasadas.length ? "alerta" : ""}>{atrasadas.length}</b><small>vencidas sin terminar</small></div>
            <div><span>Presupuesto cargado</span><b>{presupuesto ? usd(presupuesto) : "—"}</b><small>suma por gremio</small></div>
          </div>
          {proximas.length > 0 && <p className="aviso">Arrancan esta semana sin gremio asignado: {proximas.map((t) => t.tarea).join(", ")}.</p>}
          <p className="sub chico">Las fechas de la plantilla son en serie; superponé las tareas que corren en paralelo.</p>
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Tarea</th><th>Inicio</th><th>Fin</th><th>Gremio asignado</th><th>USD</th><th>Avance</th></tr></thead>
              <tbody>
                {tareas.map((t) => {
                  const g = gremios.find((x) => x.id === t.gremio_id);
                  const tarde = t.fin && t.fin < hoy && t.avance < 100;
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.tarea}</strong><br /><small className={tarde ? "alerta" : "sub"}>{t.gremio}{tarde ? " · atrasada" : ""}</small></td>
                      <td><input type="date" disabled={!puede} value={t.inicio || ""} onChange={(e) => act(t, { inicio: e.target.value || null })} /></td>
                      <td><input type="date" disabled={!puede} value={t.fin || ""} onChange={(e) => act(t, { fin: e.target.value || null })} /></td>
                      <td>
                        <select disabled={!puede} value={t.gremio_id || ""} onChange={(e) => act(t, { gremio_id: e.target.value || null })} style={{ maxWidth: 180 }}>
                          <option value="">Sin asignar</option>
                          {gremios.filter((x) => !x.rubro || x.rubro === t.gremio || x.id === t.gremio_id).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                          <option disabled>──────</option>
                          {gremios.filter((x) => x.rubro && x.rubro !== t.gremio && x.id !== t.gremio_id).map((x) => <option key={x.id} value={x.id}>{x.nombre} ({x.rubro})</option>)}
                        </select>
                        {g && waLink(g.telefono) && <a href={waLink(g.telefono, `Hola ${g.nombre.split(" ")[0]}, te escribo por la obra: ${t.tarea}.`)!} target="_blank" rel="noreferrer" className="chico"> WhatsApp</a>}
                      </td>
                      <td><input type="number" disabled={!puede} defaultValue={t.presupuesto_usd ?? ""} onBlur={(e) => act(t, { presupuesto_usd: e.target.value ? Number(e.target.value) : null })} style={{ width: 90 }} /></td>
                      <td style={{ minWidth: 130 }}>
                        <input type="range" min={0} max={100} step={10} disabled={!puede} value={t.avance} onChange={(e) => act(t, { avance: Number(e.target.value) })} aria-label={`Avance de ${t.tarea}`} />
                        <small> {t.avance}%</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
