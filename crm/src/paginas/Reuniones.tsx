import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UNIDADES, etiqueta, supabase, type Unidad } from "../config";
import { puedeOperar, useYo } from "../main";

const HORA = (d: string) => new Date(d).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const COLOR: Record<string, string> = { agendada: "#8a6d00", confirmada: "#1f7a4a", realizada: "#3d4a4e", no_asistio: "#b3261e", cancelada: "#6b7477", reprogramada: "#6b7477" };

export default function Reuniones() {
  const yo = useYo();
  const [lista, setLista] = useState<any[]>([]);
  const [vista, setVista] = useState<"proximas" | "pasadas">("proximas");
  const [nueva, setNueva] = useState<any | null>(null);
  const [contactos, setContactos] = useState<any[]>([]);
  const [error, setError] = useState("");

  const cargar = async () => {
    const { data, error } = await supabase.from("crm_reuniones").select("*, crm_contacts(id,nombre,telefono,email)").order("inicio", { ascending: vista === "proximas" })
      [vista === "proximas" ? "gte" : "lt"]("inicio", new Date(Date.now() - 2 * 3600e3).toISOString()).limit(100);
    if (error) setError("No se pudieron cargar las reuniones: " + error.message);
    setLista(data || []);
  };
  useEffect(() => { cargar(); }, [vista]);

  const marcar = async (m: any, estado: string) => {
    const { error } = await supabase.from("crm_reuniones").update({ estado, updated_at: new Date().toISOString() }).eq("id", m.id);
    if (error) return setError("No tenés permiso para cambiar esta reunión.");
    if (m.contact_id) await supabase.from("crm_activities").insert({ contact_id: m.contact_id, unidad: m.unidad, tipo: "reunion", autor: yo.clave, detalle: { resultado: estado === "realizada" ? "Reunión realizada" : "No asistió a la reunión" } });
    cargar();
  };

  const abrirNueva = async () => {
    if (!contactos.length) {
      const { data } = await supabase.from("crm_contacts").select("id,nombre").order("nombre").limit(2000);
      setContactos(data || []);
    }
    const unidad = (yo.admin ? "ranka_by_cire" : yo.unidades[0]) as Unidad;
    setNueva({ contact_id: "", unidad, inicio: "", titulo: "", link_reunion: "" });
  };
  const guardar = async () => {
    if (!nueva.contact_id || !nueva.inicio) return setError("Elegí el contacto y la fecha y hora.");
    const { error } = await supabase.from("crm_reuniones").insert({ ...nueva, inicio: new Date(nueva.inicio).toISOString(), responsable: yo.clave, origen: "manual" });
    if (error) return setError("No se pudo guardar: " + error.message);
    setNueva(null); setError(""); cargar();
  };

  const hoy = new Date().toDateString();
  return (
    <>
      <div className="cabecera">
        <div><h1>Reuniones</h1><p className="sub">Las reservas de la agenda de Google entran solas. Los recordatorios salen 24 h y 1 h antes; si no confirma, te queda una tarea para llamar.</p></div>
        <button className="primario" onClick={abrirNueva}>+ Agendar reunión</button>
      </div>
      {error && <p className="aviso">{error}</p>}
      <div className="filtros">
        <div className="segmentos">
          <button className={vista === "proximas" ? "activo" : ""} onClick={() => setVista("proximas")}>Próximas</button>
          <button className={vista === "pasadas" ? "activo" : ""} onClick={() => setVista("pasadas")}>Pasadas</button>
        </div>
      </div>
      <div className="tarjeta">
        {!lista.length && <p className="sub">{vista === "proximas" ? "No hay reuniones agendadas. Cuando alguien reserve en tu agenda, aparece acá." : "Todavía no hay reuniones pasadas."}</p>}
        {lista.map((m) => {
          const c = m.crm_contacts;
          const pasada = new Date(m.inicio).getTime() < Date.now();
          return (
            <div className="item" key={m.id}>
              <div className="item-txt">
                <span className="item-nombre">{c ? <Link to={`/contactos/${c.id}`}>{c.nombre}</Link> : "Sin contacto"}</span>
                <span className="sub">{new Date(m.inicio).toDateString() === hoy ? "Hoy, " : ""}{HORA(m.inicio)} · {UNIDADES[m.unidad as Unidad]}{m.titulo ? ` · ${m.titulo}` : ""}</span>
                <span style={{ fontSize: 12, color: COLOR[m.estado], fontWeight: 600 }}>
                  {etiqueta(m.estado)}{m.recordatorio_24h_at ? " · recordatorio 24 h enviado" : ""}{m.fathom_url && <> · <a href={m.fathom_url} target="_blank" rel="noreferrer">grabación</a></>}
                </span>
              </div>
              {puedeOperar(yo, m.unidad) && (
                <div className="item-acc">
                  {m.link_reunion && !pasada && <a href={m.link_reunion} target="_blank" rel="noreferrer"><button>Entrar</button></a>}
                  {pasada && ["agendada", "confirmada"].includes(m.estado) && <>
                    <button onClick={() => marcar(m, "realizada")}>Se hizo</button>
                    <button onClick={() => marcar(m, "no_asistio")}>No vino</button>
                  </>}
                  {!pasada && m.estado !== "cancelada" && <button className="link" onClick={() => marcar(m, "cancelada")}>Cancelar</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nueva && (
        <div className="modal-fondo" onClick={() => setNueva(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cab"><h2>Agendar reunión</h2><button className="icono" onClick={() => setNueva(null)}>✕</button></div>
            <label className="campo">Contacto
              <input list="lista-contactos" placeholder="Escribí el nombre" onChange={(e) => setNueva({ ...nueva, contact_id: contactos.find((c) => c.nombre === e.target.value)?.id || "" })} />
              <datalist id="lista-contactos">{contactos.map((c) => <option key={c.id} value={c.nombre} />)}</datalist>
            </label>
            <label className="campo">Unidad
              <select value={nueva.unidad} onChange={(e) => setNueva({ ...nueva, unidad: e.target.value })}>
                {(Object.keys(UNIDADES) as Unidad[]).filter((u) => puedeOperar(yo, u)).map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}
              </select>
            </label>
            <label className="campo">Fecha y hora<input type="datetime-local" value={nueva.inicio} onChange={(e) => setNueva({ ...nueva, inicio: e.target.value })} /></label>
            <label className="campo">Motivo<input value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} placeholder="Ej.: presentación de propuesta" /></label>
            <label className="campo">Link de videollamada (opcional)<input value={nueva.link_reunion} onChange={(e) => setNueva({ ...nueva, link_reunion: e.target.value })} /></label>
            <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}><button className="primario" onClick={guardar}>Agendar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
