import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, usd, waLink } from "../config";
import { useYo } from "../main";

const ESTADOS: Record<string, string> = { sin_contactar: "Sin contactar", contactada: "Contactada", respondio: "Respondió", mando_propiedad: "Mandó propiedad", aliada: "Aliada", no_interesa: "No le interesa" };
const POR_PAGINA = 100;
const cabaprop = (nombre: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:cabaprop.com.ar "${nombre}"`)}`;

async function traerTodas() {
  const filas: any[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from("crm_organizaciones").select("*").order("nombre").range(desde, desde + 999);
    if (error || !data) break;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas;
}

export default function Organizaciones() {
  const yo = useYo();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [barrio, setBarrio] = useState("");
  const [filtro, setFiltro] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const [o, c, p] = await Promise.all([
      traerTodas(),
      supabase.from("crm_contacts").select("id,nombre,telefono,organizacion_id").not("organizacion_id", "is", null),
      supabase.from("crm_propiedades").select("id,direccion,barrio,etapa_loacc,organizacion_id").not("organizacion_id", "is", null),
    ]);
    setOrgs(o); setContactos(c.data || []); setProps(p.data || []); setCargando(false);
    if (sel) setSel(o.find((x: any) => x.id === sel.id) || null);
  };
  useEffect(() => { cargar(); }, []);
  useEffect(() => { setPagina(0); }, [q, barrio, filtro, estado]);

  const barrios = useMemo(() => {
    const m = new Map<string, number>();
    orgs.forEach((o) => o.barrio && m.set(o.barrio, (m.get(o.barrio) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [orgs]);

  const vis = useMemo(() => {
    const t = q.toLowerCase();
    return orgs.filter((o) =>
      (!t || [o.nombre, o.barrio, o.zonas, o.direccion, o.email, String(o.matricula || "")].some((v) => v?.toLowerCase().includes(t))) &&
      (!barrio || o.barrio === barrio) &&
      (!estado || (o.estado_contacto || "sin_contactar") === estado) &&
      (!filtro || (filtro === "whatsapp" ? !!o.whatsapp : o[filtro]))
    );
  }, [orgs, q, barrio, filtro, estado]);

  const nueva = async () => {
    const nombre = prompt("Nombre de la inmobiliaria");
    if (!nombre) return;
    const { data, error } = await supabase.from("crm_organizaciones").insert({ nombre, fuente: "Carga manual" }).select().single();
    if (error) return alert(error.message.includes("duplicate") ? "Ya existe una con ese nombre en ese barrio." : error.message);
    await cargar(); setSel(data);
  };
  const guardar = async (cambios: any) => {
    setSel({ ...sel, ...cambios });
    setOrgs((l) => l.map((o) => (o.id === sel.id ? { ...o, ...cambios } : o)));
    await supabase.from("crm_organizaciones").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", sel.id);
  };
  const marcarContacto = async (o: any) => {
    const cambios = { estado_contacto: o.estado_contacto === "sin_contactar" || !o.estado_contacto ? "contactada" : o.estado_contacto, ultimo_contacto: new Date().toISOString().slice(0, 10) };
    setOrgs((l) => l.map((x) => (x.id === o.id ? { ...x, ...cambios } : x)));
    if (sel?.id === o.id) setSel({ ...sel, ...cambios });
    await supabase.from("crm_organizaciones").update(cambios).eq("id", o.id);
  };
  const msg = (o: any) => `Hola, ¿cómo están? Soy Matías Larrea de CIRE. Compramos PH y departamentos para reciclar en ${o.barrio || "CABA"}. Si tienen propiedades a reciclar o con alguna complicación (sucesión, deudas, mal estado), las analizamos rápido y pagamos honorarios completos. ¿Tienen algo así en cartera?`;
  const Campo = ({ label, k, tipo = "text" }: { label: string; k: string; tipo?: string }) => (
    <label className="campo chico">{label}<input type={tipo} defaultValue={sel[k] ?? ""} key={sel.id + k} onBlur={(e) => { const v = tipo === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null; if (v !== sel[k]) guardar({ [k]: v }); }} /></label>
  );
  const Check = ({ label, k }: { label: string; k: string }) => (
    <label className="fila chico"><input type="checkbox" checked={!!sel[k]} onChange={(e) => guardar({ [k]: e.target.checked })} /> {label}</label>
  );
  const exportar = () => {
    const esc = (v: unknown) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const cab = ["nombre", "matricula", "barrio", "direccion", "telefono", "whatsapp", "email", "web", "propiedades_venta", "estado_contacto"];
    const csv = [cab.join(","), ...vis.map((o) => cab.map((k) => esc(o[k])).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = `inmobiliarias${barrio ? "-" + barrio : ""}.csv`; a.click();
  };

  const pag = vis.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const paginas = Math.ceil(vis.length / POR_PAGINA);

  return (
    <>
      <div className="cabecera">
        <div><h1>Inmobiliarias</h1><p className="sub">{orgs.length.toLocaleString("es-AR")} inmobiliarias: el directorio de CABA (Cabaprop), las que tenés agendadas en WhatsApp y las cargadas a mano. Filtrá por barrio para difundir una propiedad o pedir producto.</p></div>
        <div className="fila">
          {yo.admin && <button onClick={exportar}>Exportar {vis.length.toLocaleString("es-AR")} a CSV</button>}
          <button className="primario" onClick={nueva}>+ Nueva inmobiliaria</button>
        </div>
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar nombre, dirección, email o matrícula" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={barrio} onChange={(e) => setBarrio(e.target.value)} aria-label="Barrio">
          <option value="">Todos los barrios</option>
          {barrios.map(([b, n]) => <option key={b} value={b}>{b} ({n})</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado de contacto">
          <option value="">Cualquier estado</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="segmentos">
          {[["", "Todas"], ["whatsapp", "Con WhatsApp"], ["cliente_ranka", "Clientes Ranka"], ["trae_producto", "Traen producto"], ["trae_inversores", "Traen inversores"]].map(([k, v]) => <button key={k} className={filtro === k ? "activo" : ""} onClick={() => setFiltro(k)}>{v}</button>)}
        </div>
      </div>
      <p className="sub">{cargando ? "Cargando el directorio…" : `${vis.length.toLocaleString("es-AR")} resultados`}</p>
      <div className="ficha">
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Inmobiliaria</th><th>Barrio</th><th>En venta</th><th>Estado</th><th>Contactar</th></tr></thead>
            <tbody>
              {pag.map((o) => {
                const wa = waLink(o.whatsapp || null, msg(o));
                return (
                  <tr key={o.id} className={`clic ${sel?.id === o.id ? "sel" : ""}`} onClick={() => setSel(o)}>
                    <td><strong>{o.nombre}</strong>{o.matricula && <><br /><small className="sub">Mat. {o.matricula}</small></>}</td>
                    <td>{o.barrio || o.zonas || "—"}</td>
                    <td>{o.propiedades_venta || "—"}</td>
                    <td><span className="chip">{ESTADOS[o.estado_contacto || "sin_contactar"]}</span>{o.cliente_ranka && <span className="chip inmobiliaria">Cliente Ranka</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="fila" style={{ gap: 6, flexWrap: "nowrap" }}>
                        {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => marcarContacto(o)}><button className="chico">WhatsApp</button></a>}
                        {o.email && <a href={`mailto:${o.email}`} onClick={() => marcarContacto(o)}><button className="chico">Mail</button></a>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!cargando && !vis.length && <tr><td colSpan={5} className="sub">Ninguna inmobiliaria coincide con estos filtros.</td></tr>}
            </tbody>
          </table>
          {paginas > 1 && (
            <div className="fila" style={{ justifyContent: "center", margin: "12px 0" }}>
              <button className="chico" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span className="sub">Página {pagina + 1} de {paginas}</span>
              <button className="chico" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
            </div>
          )}
        </div>
        {sel && (
          <div className="tarjeta">
            <div className="modal-cab"><h2 style={{ margin: 0 }}>{sel.nombre}</h2><button className="icono" onClick={() => setSel(null)} aria-label="Cerrar">✕</button></div>
            <p className="sub" style={{ marginTop: 0 }}>{[sel.matricula && `Matrícula ${sel.matricula}`, sel.direccion, sel.fuente].filter(Boolean).join(" · ")}</p>
            <div className="fila" style={{ marginBottom: 8 }}>
              {waLink(sel.whatsapp || sel.telefono || null) && <a href={waLink(sel.whatsapp || sel.telefono, msg(sel))!} target="_blank" rel="noreferrer" onClick={() => marcarContacto(sel)}><button className="chico">WhatsApp</button></a>}
              {sel.telefono && <a href={`tel:${sel.telefono}`}><button className="chico">Llamar</button></a>}
              {sel.web && <a href={sel.web} target="_blank" rel="noreferrer"><button className="chico">Web</button></a>}
              <a href={cabaprop(sel.nombre)} target="_blank" rel="noreferrer"><button className="chico">Ver en Cabaprop</button></a>
            </div>
            <label className="campo chico">Estado del contacto
              <select value={sel.estado_contacto || "sin_contactar"} onChange={(e) => guardar({ estado_contacto: e.target.value, ultimo_contacto: new Date().toISOString().slice(0, 10) })}>
                {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {sel.ultimo_contacto && <p className="sub chico">Último contacto: {new Date(sel.ultimo_contacto + "T12:00").toLocaleDateString("es-AR")}</p>}
            <div className="fila" style={{ gap: 14, margin: "10px 0 6px" }}>
              {Check({ label: "Cliente de Ranka", k: "cliente_ranka" })}
              {Check({ label: "Trae producto a CIRE", k: "trae_producto" })}
              {Check({ label: "Trae inversores", k: "trae_inversores" })}
              {Check({ label: "Hace pauta", k: "hace_pauta" })}
            </div>
            <div className="grilla-campos">
              {Campo({ label: "Teléfono", k: "telefono" })}{Campo({ label: "WhatsApp", k: "whatsapp" })}
              {Campo({ label: "Email", k: "email" })}{Campo({ label: "Web", k: "web" })}
              {Campo({ label: "Instagram", k: "instagram" })}{Campo({ label: "Barrio", k: "barrio" })}
              {Campo({ label: "Dirección", k: "direccion" })}{Campo({ label: "Zonas que trabaja", k: "zonas" })}
              {Campo({ label: "Propiedades en venta", k: "propiedades_venta", tipo: "number" })}
              {Campo({ label: "Ticket promedio (USD)", k: "ticket_promedio_usd", tipo: "number" })}
            </div>
            {sel.propiedades_venta && sel.ticket_promedio_usd ? <p className="sub chico">Cartera estimada: {usd(sel.propiedades_venta * sel.ticket_promedio_usd)}</p> : null}
            <label className="campo chico">Notas<textarea defaultValue={sel.notas || ""} key={sel.id + "notas"} rows={3} onBlur={(e) => e.target.value !== (sel.notas || "") && guardar({ notas: e.target.value || null })} /></label>
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
