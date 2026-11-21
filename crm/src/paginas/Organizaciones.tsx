import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, usd } from "../config";
import { useYo } from "../main";

export default function Organizaciones() {
  useYo();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");

  const cargar = async () => {
    const [o, c, p] = await Promise.all([
      supabase.from("crm_organizaciones").select("*").order("nombre"),
      supabase.from("crm_contacts").select("id,nombre,telefono,organizacion_id").not("organizacion_id", "is", null),
      supabase.from("crm_propiedades").select("id,direccion,barrio,etapa_loacc,organizacion_id").not("organizacion_id", "is", null),
    ]);
    setOrgs(o.data || []); setContactos(c.data || []); setProps(p.data || []);
    if (sel) setSel((o.data || []).find((x: any) => x.id === sel.id) || null);
  };
  useEffect(() => { cargar(); }, []);

  const vis = useMemo(() => orgs.filter((o) =>
    (!q || [o.nombre, o.barrio, o.zonas].some((v: string) => v?.toLowerCase().includes(q.toLowerCase()))) &&
    (!filtro || o[filtro])
  ), [orgs, q, filtro]);

  const nueva = async () => {
    const nombre = prompt("Nombre de la inmobiliaria");
    if (!nombre) return;
    const { data, error } = await supabase.from("crm_organizaciones").insert({ nombre }).select().single();
    if (error) return alert(error.message.includes("duplicate") ? "Ya existe una con ese nombre." : error.message);
    await cargar(); setSel(data);
  };
  const guardar = async (cambios: any) => {
    setSel({ ...sel, ...cambios });
    await supabase.from("crm_organizaciones").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", sel.id);
    cargar();
  };
  const Campo = ({ label, k, tipo = "text" }: { label: string; k: string; tipo?: string }) => (
    <label className="campo chico">{label}<input type={tipo} defaultValue={sel[k] ?? ""} key={sel.id + k} onBlur={(e) => { const v = tipo === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null; if (v !== sel[k]) guardar({ [k]: v }); }} /></label>
  );
  const Check = ({ label, k }: { label: string; k: string }) => (
    <label className="fila chico"><input type="checkbox" checked={!!sel[k]} onChange={(e) => guardar({ [k]: e.target.checked })} /> {label}</label>
  );

  return (
    <>
      <div className="cabecera">
        <div><h1>Inmobiliarias</h1><p className="sub">Cada inmobiliaria como empresa: sus contactos, si es cliente de Ranka y qué le trajo a la desarrolladora.</p></div>
        <button className="primario" onClick={nueva}>+ Nueva inmobiliaria</button>
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar nombre, barrio o zona" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="segmentos">
          {[["", "Todas"], ["cliente_ranka", "Clientes Ranka"], ["trae_producto", "Traen producto"], ["trae_inversores", "Traen inversores"]].map(([k, v]) => <button key={k} className={filtro === k ? "activo" : ""} onClick={() => setFiltro(k)}>{v}</button>)}
        </div>
      </div>
      <div className="ficha">
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Inmobiliaria</th><th>Zona</th><th>Contactos</th><th>Propiedades traídas</th><th></th></tr></thead>
            <tbody>
              {vis.map((o) => (
                <tr key={o.id} className="clic" onClick={() => setSel(o)}>
                  <td><strong>{o.nombre}</strong></td>
                  <td>{o.barrio || o.zonas || "—"}</td>
                  <td>{contactos.filter((c) => c.organizacion_id === o.id).length}</td>
                  <td>{props.filter((p) => p.organizacion_id === o.id).length}</td>
                  <td>{o.cliente_ranka && <span className="chip inmobiliaria">Cliente Ranka</span>}{o.trae_producto && <span className="chip">Trae producto</span>}{o.trae_inversores && <span className="chip inversor">Trae inversores</span>}</td>
                </tr>
              ))}
              {!vis.length && <tr><td colSpan={5} className="sub">Todavía no hay inmobiliarias cargadas. La base de 3.260 inmobiliarias de CABA entra cuando se suba el listado completo.</td></tr>}
            </tbody>
          </table>
        </div>
        {sel && (
          <div className="tarjeta">
            <h2>{sel.nombre}</h2>
            <div className="fila" style={{ gap: 14, marginBottom: 6 }}>
              {Check({ label: "Cliente de Ranka", k: "cliente_ranka" })}
              {Check({ label: "Trae producto a CIRE", k: "trae_producto" })}
              {Check({ label: "Trae inversores", k: "trae_inversores" })}
              {Check({ label: "Hace pauta", k: "hace_pauta" })}
            </div>
            <div className="grilla-campos">
              {Campo({ label: "Teléfono", k: "telefono" })}{Campo({ label: "Email", k: "email" })}
              {Campo({ label: "Web", k: "web" })}{Campo({ label: "Instagram", k: "instagram" })}
              {Campo({ label: "Barrio", k: "barrio" })}{Campo({ label: "Zonas que trabaja", k: "zonas" })}
              {Campo({ label: "Cartera aproximada (propiedades)", k: "cartera_aprox", tipo: "number" })}
              {Campo({ label: "Ticket promedio (USD)", k: "ticket_promedio_usd", tipo: "number" })}
            </div>
            {sel.cartera_aprox && sel.ticket_promedio_usd ? <p className="sub chico">Cartera estimada: {usd(sel.cartera_aprox * sel.ticket_promedio_usd)}</p> : null}
            <h3>Contactos</h3>
            {contactos.filter((c) => c.organizacion_id === sel.id).map((c) => <div key={c.id}><Link to={`/contactos/${c.id}`}>{c.nombre}</Link> <small className="sub">{c.telefono}</small></div>)}
            {!contactos.some((c) => c.organizacion_id === sel.id) && <p className="sub chico">Asigná contactos desde su ficha.</p>}
            <h3>Propiedades que trajo</h3>
            {props.filter((p) => p.organizacion_id === sel.id).map((p) => <div key={p.id}><Link to={`/propiedades/${p.id}`}>{p.direccion}</Link> <small className="sub">{p.barrio}</small></div>)}
            {!props.some((p) => p.organizacion_id === sel.id) && <p className="sub chico">Ninguna todavía.</p>}
          </div>
        )}
      </div>
    </>
  );
}
