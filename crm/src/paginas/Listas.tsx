import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UNIDADES, etiqueta, fecha, supabase, waLink, type Unidad } from "../config";
import { puedeOperar, useYo } from "../main";
import { BarraFiltros, aplicarFiltro, exportarCSV, filtroVacio, useContactos, type Filtro } from "./Contactos";

const ESTADOS = ["invitado", "interesado", "inscripto", "asistio", "compro", "no_interesado"];

export default function Listas() {
  const yo = useYo();
  const { filas } = useContactos();
  const [listas, setListas] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [creando, setCreando] = useState(false);
  const [f, setF] = useState<Filtro>(filtroVacio);
  const [d, setD] = useState({ nombre: "", unidad: (yo.unidades[0] || "ranka") as Unidad, tipo: "evento", fecha_evento: "", descripcion: "", excluir_clientes_activos: true });

  const cargar = () => supabase.from("crm_listas").select("*").order("created_at", { ascending: false }).then(({ data }) => setListas(data || []));
  useEffect(() => { cargar(); }, []);
  const abrir = async (l: any) => {
    setSel(l);
    const { data } = await supabase.from("crm_lista_miembros").select("estado,contact_id,crm_contacts(nombre,telefono,email,barrio)").eq("lista_id", l.id);
    setMiembros(data || []);
  };

  const candidatos = useMemo(() => {
    let r = aplicarFiltro(filas, f);
    if (d.excluir_clientes_activos) r = r.filter((c) => !c.relaciones.some((x) => x.estado === "cliente_activo"));
    return r;
  }, [filas, f, d.excluir_clientes_activos]);

  const crear = async () => {
    const { data: l, error } = await supabase.from("crm_listas").insert({ ...d, fecha_evento: d.fecha_evento || null, filtros: f, creado_por: yo.clave }).select().single();
    if (error) return alert("No tenés permiso para crear listas en esa unidad.");
    const filasM = candidatos.map((c) => ({ lista_id: l.id, contact_id: c.id }));
    for (let i = 0; i < filasM.length; i += 500) await supabase.from("crm_lista_miembros").insert(filasM.slice(i, i + 500));
    setCreando(false); cargar(); abrir(l);
  };
  const cambiarEstado = async (m: any, estado: string) => {
    await supabase.from("crm_lista_miembros").update({ estado, updated_at: new Date().toISOString() }).eq("lista_id", sel.id).eq("contact_id", m.contact_id);
    abrir(sel);
  };

  return (
    <>
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <div><h1>Listas y eventos</h1><p className="sub">Segmentos separados por acción: por ejemplo, las jornadas de filmación para inmobiliarias, solo a prospectos.</p></div>
        <button className="primario" onClick={() => setCreando(!creando)}>{creando ? "Cerrar" : "+ Nueva lista o evento"}</button>
      </div>

      {creando && (
        <div className="tarjeta" style={{ marginBottom: 16 }}>
          <div className="filtros">
            <input placeholder="Nombre (ej. Jornada de filmación #1)" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} style={{ minWidth: 260 }} />
            <select value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value })}><option value="evento">Evento</option><option value="lista">Lista</option></select>
            <select value={d.unidad} onChange={(e) => setD({ ...d, unidad: e.target.value as Unidad })}>
              {(Object.keys(UNIDADES) as Unidad[]).filter((u) => puedeOperar(yo, u)).map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}
            </select>
            {d.tipo === "evento" && <input type="date" value={d.fecha_evento} onChange={(e) => setD({ ...d, fecha_evento: e.target.value })} />}
            <label className="fila"><input type="checkbox" checked={d.excluir_clientes_activos} onChange={(e) => setD({ ...d, excluir_clientes_activos: e.target.checked })} /> Excluir clientes activos</label>
          </div>
          <p className="sub" style={{ margin: "4px 0 8px" }}>Elegí a quién incluir:</p>
          <BarraFiltros f={f} setF={setF} />
          <div className="fila"><strong>{candidatos.length} contactos</strong><button className="primario" disabled={!d.nombre || !candidatos.length} onClick={crear}>Crear con estos contactos</button></div>
        </div>
      )}

      <div className="ficha">
        <div>
          <table>
            <thead><tr><th>Lista</th><th>Unidad</th><th>Fecha</th></tr></thead>
            <tbody>
              {listas.map((l) => (
                <tr key={l.id} className="clic" onClick={() => abrir(l)}>
                  <td><strong>{l.nombre}</strong><br /><small className="sub">{etiqueta(l.tipo)}</small></td>
                  <td>{UNIDADES[l.unidad as Unidad]}</td>
                  <td>{l.fecha_evento ? fecha(l.fecha_evento + "T12:00") : "Sin fecha"}</td>
                </tr>
              ))}
              {!listas.length && <tr><td colSpan={3} className="sub">Todavía no hay listas.</td></tr>}
            </tbody>
          </table>
        </div>
        {sel && (
          <div className="tarjeta">
            <div className="fila" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{sel.nombre}</h2>
              {yo.admin && <button onClick={() => exportarCSV(filas.filter((c) => miembros.some((m) => m.contact_id === c.id)), sel.nombre)}>Exportar CSV</button>}
            </div>
            <div className="fila" style={{ margin: "8px 0" }}>{ESTADOS.map((s) => <span key={s} className="chip">{etiqueta(s)}: <b>{miembros.filter((m) => m.estado === s).length}</b></span>)}</div>
            <table>
              <tbody>
                {miembros.map((m) => (
                  <tr key={m.contact_id}>
                    <td><Link to={`/contactos/${m.contact_id}`}>{m.crm_contacts?.nombre}</Link><br /><small className="sub">{m.crm_contacts?.barrio}</small></td>
                    <td>{waLink(m.crm_contacts?.telefono) && <a href={waLink(m.crm_contacts?.telefono)!} target="_blank" rel="noreferrer">WhatsApp</a>}</td>
                    <td><select value={m.estado} disabled={!puedeOperar(yo, sel.unidad)} onChange={(e) => cambiarEstado(m, e.target.value)}>{ESTADOS.map((s) => <option key={s} value={s}>{etiqueta(s)}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
