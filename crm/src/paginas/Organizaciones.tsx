import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, usd, waLink, hoyBA } from "../config";
import { useYo } from "../main";

// Red de inmobiliarias: pedir producto y difundir. El estado es un embudo, no una etiqueta suelta.
const PASOS: { id: string; nombre: string; siguiente: string }[] = [
  { id: "sin_contactar", nombre: "Sin contactar", siguiente: "Mandá el WhatsApp de pedido de producto." },
  { id: "contactada", nombre: "Contactada", siguiente: "Si en 3 días no responde, segundo mensaje o llamado." },
  { id: "respondio", nombre: "Respondió", siguiente: "Pedile fichas de PH o deptos a reciclar en su zona." },
  { id: "mando_propiedad", nombre: "Mandó propiedad", siguiente: "Analizá la propiedad en 48 h y devolvé respuesta." },
  { id: "aliada", nombre: "Aliada", siguiente: "Sumala a la difusión de cada inmueble que salga a la venta." },
];
const NO_INTERESA = { id: "no_interesa", nombre: "No le interesa" };
const NOMBRE_ESTADO: Record<string, string> = Object.fromEntries([...PASOS, NO_INTERESA].map((p) => [p.id, p.nombre]));
const ETIQUETAS: [string, string][] = [["cliente_ranka", "Cliente de Ranka"], ["trae_producto", "Trae producto"], ["trae_inversores", "Trae inversores"], ["hace_pauta", "Hace pauta"]];
const POR_PAGINA = 50;
const cabaprop = (nombre: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:cabaprop.com.ar "${nombre}"`)}`;
const hoy = () => hoyBA();
// El directorio viene en mayúsculas: lo mostramos en formato título sin tocar el dato guardado
const titulo = (s: string) => (s && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s.(/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()).replace(/\bS\.?a\.?\b/g, "SA").replace(/\bS\.?r\.?l\.?\b/gi, "SRL") : s);
const haceCuanto = (d?: string | null) => {
  if (!d) return "—";
  const dias = Math.floor((Date.now() - +new Date(d + "T12:00")) / 864e5);
  return dias <= 0 ? "Hoy" : dias === 1 ? "Ayer" : dias < 30 ? `Hace ${dias} días` : new Date(d + "T12:00").toLocaleDateString("es-AR");
};

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
  const navegar = useNavigate();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [params] = useSearchParams();
  const [selId, setSelId] = useState<string | null>(params.get("id"));
  useEffect(() => { if (params.get("id")) setSelId(params.get("id")); }, [params]);
  const [q, setQ] = useState("");
  const [barrio, setBarrio] = useState("");
  const [estado, setEstado] = useState("");
  const [soloWa, setSoloWa] = useState(false);
  const [etiqueta, setEtiqueta] = useState("");
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [nuevaProp, setNuevaProp] = useState<{ direccion: string; precio: string } | null>(null);
  const [alta, setAlta] = useState<{ nombre: string; barrio: string; whatsapp: string } | null>(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    const [o, c, p] = await Promise.all([
      traerTodas(),
      supabase.from("crm_contacts").select("id,nombre,telefono,organizacion_id").not("organizacion_id", "is", null),
      supabase.from("crm_propiedades").select("id,direccion,barrio,etapa_loacc,organizacion_id").not("organizacion_id", "is", null),
    ]);
    setOrgs(o); setContactos(c.data || []); setProps(p.data || []); setCargando(false);
  };
  useEffect(() => { cargar(); }, []);
  useEffect(() => { setPagina(0); }, [q, barrio, estado, soloWa, etiqueta]);
  useEffect(() => { setNuevaProp(null); setError(""); }, [selId]);

  const sel = orgs.find((o) => o.id === selId) || null;
  const est = (o: any) => o.estado_contacto || "sin_contactar";

  const barrios = useMemo(() => {
    const m = new Map<string, number>();
    orgs.forEach((o) => o.barrio && m.set(o.barrio, (m.get(o.barrio) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [orgs]);

  // El embudo se cuenta sobre los filtros de barrio y búsqueda, así ves cómo vas en cada zona
  const base = useMemo(() => {
    const t = q.toLowerCase();
    return orgs.filter((o) =>
      (!t || [o.nombre, o.barrio, o.zonas, o.direccion, o.email, String(o.matricula || "")].some((v) => v?.toLowerCase().includes(t))) &&
      (!barrio || o.barrio === barrio) && (!soloWa || !!o.whatsapp) && (!etiqueta || o[etiqueta]));
  }, [orgs, q, barrio, soloWa, etiqueta]);
  const conteo = useMemo(() => { const m: Record<string, number> = {}; base.forEach((o) => { m[est(o)] = (m[est(o)] || 0) + 1; }); return m; }, [base]);
  const vis = useMemo(() => (estado ? base.filter((o) => est(o) === estado) : base), [base, estado]);
  const pag = vis.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const paginas = Math.ceil(vis.length / POR_PAGINA);

  const actualizar = async (id: string, cambios: any) => {
    setOrgs((l) => l.map((o) => (o.id === id ? { ...o, ...cambios } : o)));
    const { error: e } = await supabase.from("crm_organizaciones").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", id);
    if (e) setError("No se pudo guardar: " + e.message);
  };
  const marcarContacto = (o: any) => actualizar(o.id, { estado_contacto: est(o) === "sin_contactar" ? "contactada" : est(o), ultimo_contacto: hoy() });
  const msg = (o: any) => `Hola, ¿cómo están? Soy Matías Larrea de CIRE. Compramos PH y departamentos para reciclar en ${o.barrio || "CABA"}. Si tienen propiedades a reciclar o con alguna complicación (sucesión, deudas, mal estado), las analizamos rápido y pagamos honorarios completos. ¿Tienen algo así en cartera?`;

  const crear = async () => {
    if (!alta?.nombre.trim()) return;
    const { data, error: e } = await supabase.from("crm_organizaciones").insert({ nombre: alta.nombre.trim(), barrio: alta.barrio || null, whatsapp: alta.whatsapp || null, fuente: "Carga manual" }).select().single();
    if (e) return setError(e.message.includes("duplicate") ? "Ya existe una inmobiliaria con ese nombre en ese barrio." : e.message);
    setOrgs((l) => [data, ...l]); setAlta(null); setSelId(data.id); setError("");
  };
  // Cierra el circuito red → adquisición: la propiedad que manda una inmobiliaria entra a Propiedades en etapa L
  const cargarPropiedad = async () => {
    if (!sel || !nuevaProp?.direccion.trim()) return;
    const precio = Number(nuevaProp.precio.replace(/\D/g, "")) || null;
    const { data, error: e } = await supabase.from("crm_propiedades").insert({ direccion: nuevaProp.direccion.trim(), barrio: sel.barrio, organizacion_id: sel.id, precio_pedido_usd: precio, prospecto_por: "inmobiliaria", responsable: yo.clave }).select("id").single();
    if (e) return setError(e.message);
    await actualizar(sel.id, { estado_contacto: "mando_propiedad", trae_producto: true, ultimo_contacto: hoy() });
    navegar(`/propiedades/${data.id}`);
  };
  const exportar = () => {
    const esc = (v: unknown) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const cab = ["nombre", "matricula", "barrio", "direccion", "telefono", "whatsapp", "email", "web", "propiedades_venta", "estado_contacto", "ultimo_contacto"];
    const csv = [cab.join(","), ...vis.map((o) => cab.map((k) => esc(o[k])).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = `inmobiliarias${barrio ? "-" + barrio : ""}.csv`; a.click();
  };

  const Campo = ({ label, k, tipo = "text" }: { label: string; k: string; tipo?: string }) => (
    <label className="campo chico">{label}<input type={tipo} autoComplete="off" defaultValue={sel[k] ?? ""} key={sel.id + k} onBlur={(e) => { const v = tipo === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null; if (v !== sel[k]) actualizar(sel.id, { [k]: v }); }} /></label>
  );

  const paso = sel ? PASOS.find((p) => p.id === est(sel)) : null;
  const propsSel = sel ? props.filter((p) => p.organizacion_id === sel.id) : [];
  const contactosSel = sel ? contactos.filter((c) => c.organizacion_id === sel.id) : [];
  const waSel = sel ? waLink(sel.whatsapp || sel.telefono || null, msg(sel)) : null;

  return (
    <div className="red">
      <div className="cabecera">
        <div>
          <h1>Inmobiliarias</h1>
          <p className="sub">Tu red para conseguir producto y difundir inmuebles. Elegí un barrio, contactá y movelas por el embudo.</p>
        </div>
        <div className="fila">
          {yo.admin && <button onClick={exportar}>Exportar {vis.length.toLocaleString("es-AR")}</button>}
          <button className="primario" onClick={() => setAlta({ nombre: "", barrio: barrio, whatsapp: "" })}>+ Nueva</button>
        </div>
      </div>

      {alta && (
        <div className="tarjeta red-alta">
          <input placeholder="Nombre de la inmobiliaria" autoFocus autoComplete="off" value={alta.nombre} onChange={(e) => setAlta({ ...alta, nombre: e.target.value })} />
          <select value={alta.barrio} onChange={(e) => setAlta({ ...alta, barrio: e.target.value })} aria-label="Barrio"><option value="">Barrio</option>{barrios.map(([b]) => <option key={b}>{b}</option>)}</select>
          <input placeholder="WhatsApp" autoComplete="off" inputMode="tel" value={alta.whatsapp} onChange={(e) => setAlta({ ...alta, whatsapp: e.target.value })} />
          <button className="primario" onClick={crear}>Guardar</button>
          <button onClick={() => setAlta(null)}>Cancelar</button>
        </div>
      )}
      {error && <p className="red-error" role="alert">{error}</p>}

      <div className="red-embudo" role="tablist" aria-label="Estado en la red">
        <button className={!estado ? "activo" : ""} onClick={() => setEstado("")}><span>Todas</span><strong>{base.length.toLocaleString("es-AR")}</strong></button>
        {PASOS.map((p) => (
          <button key={p.id} className={estado === p.id ? "activo" : ""} onClick={() => setEstado(estado === p.id ? "" : p.id)}>
            <span>{p.nombre}</span><strong>{(conteo[p.id] || 0).toLocaleString("es-AR")}</strong>
          </button>
        ))}
        <button className={`descarte ${estado === NO_INTERESA.id ? "activo" : ""}`} onClick={() => setEstado(estado === NO_INTERESA.id ? "" : NO_INTERESA.id)}><span>{NO_INTERESA.nombre}</span><strong>{conteo[NO_INTERESA.id] || 0}</strong></button>
      </div>

      <div className="red-filtros">
        <input type="search" placeholder="Buscar por nombre, dirección, email o matrícula" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={barrio} onChange={(e) => setBarrio(e.target.value)} aria-label="Barrio">
          <option value="">Todos los barrios</option>
          {barrios.map(([b, n]) => <option key={b} value={b}>{b} · {n}</option>)}
        </select>
        <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} aria-label="Etiqueta">
          <option value="">Cualquier etiqueta</option>
          {ETIQUETAS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="red-check"><input type="checkbox" checked={soloWa} onChange={(e) => setSoloWa(e.target.checked)} /> Solo con WhatsApp</label>
      </div>

      <div className={`red-cuerpo ${sel ? "con-panel" : ""}`}>
        <div className="red-lista tarjeta">
          <div className="red-lista-cab"><span>{cargando ? "Cargando el directorio…" : `${vis.length.toLocaleString("es-AR")} inmobiliarias`}</span>{paginas > 1 && <span>Página {pagina + 1} de {paginas}</span>}</div>
          <div className="tabla-scroll">
            <table className="red-tabla">
              <thead><tr><th>Inmobiliaria</th><th className="num">En venta</th><th>Estado</th><th className="red-col-ult">Último contacto</th><th aria-label="Acciones"></th></tr></thead>
              <tbody>
                {pag.map((o) => {
                  const wa = waLink(o.whatsapp || null, msg(o));
                  return (
                    <tr key={o.id} className={`clic ${selId === o.id ? "sel" : ""}`} onClick={() => setSelId(o.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelId(o.id)}>
                      <td className="red-nombre"><strong>{titulo(o.nombre)}</strong><small>{[o.barrio || o.zonas, o.matricula && `Mat. ${o.matricula}`].filter(Boolean).join(" · ") || "Sin barrio"}</small></td>
                      <td className="num">{o.propiedades_venta || "—"}</td>
                      <td><span className={`estado-red ${est(o)}`}>{NOMBRE_ESTADO[est(o)]}</span></td>
                      <td className="red-col-ult sub">{haceCuanto(o.ultimo_contacto)}</td>
                      <td className="red-acc" onClick={(e) => e.stopPropagation()}>
                        {wa ? <a href={wa} target="_blank" rel="noreferrer" onClick={() => marcarContacto(o)} className="boton chico">WhatsApp</a> : <span className="sub chico">Sin WhatsApp</span>}
                      </td>
                    </tr>
                  );
                })}
                {!cargando && !vis.length && <tr><td colSpan={5} className="sub">Ninguna inmobiliaria coincide. Probá con otro barrio o estado.</td></tr>}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <div className="red-paginas">
              <button className="chico" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span className="sub">{pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, vis.length)} de {vis.length.toLocaleString("es-AR")}</span>
              <button className="chico" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
            </div>
          )}
        </div>

        {sel && (
          <section className="red-panel tarjeta" aria-label={`Ficha de ${titulo(sel.nombre)}`}>
            <div className="red-panel-cab">
              <div>
                <h2>{titulo(sel.nombre)}</h2>
                <p className="sub chico">{[sel.barrio, sel.matricula && `Matrícula ${sel.matricula}`, sel.propiedades_venta && `${sel.propiedades_venta} en venta`].filter(Boolean).join(" · ")}</p>
              </div>
              <button className="icono" onClick={() => setSelId(null)} aria-label="Cerrar ficha">✕</button>
            </div>

            <div className="red-acciones">
              {waSel ? <a href={waSel} target="_blank" rel="noreferrer" onClick={() => marcarContacto(sel)} className="boton primario">WhatsApp</a> : <span className="sub chico">Cargá un WhatsApp para escribirle</span>}
              {sel.telefono && <a href={`tel:${sel.telefono}`} className="boton">Llamar</a>}
              {sel.email && <a href={`mailto:${sel.email}`} onClick={() => marcarContacto(sel)} className="boton">Mail</a>}
              <a href={cabaprop(sel.nombre)} target="_blank" rel="noreferrer" className="boton">Cabaprop</a>
            </div>

            <section>
              <h3>Dónde está en la red</h3>
              <div className="red-pasos">
                {PASOS.map((p, i) => {
                  const actual = PASOS.findIndex((x) => x.id === est(sel));
                  return <button key={p.id} className={`${i < actual ? "hecho" : ""} ${i === actual ? "actual" : ""}`} onClick={() => actualizar(sel.id, { estado_contacto: p.id, ultimo_contacto: hoy() })}>{p.nombre}</button>;
                })}
              </div>
              {paso ? <p className="red-siguiente"><strong>Próximo paso:</strong> {paso.siguiente}</p> : <p className="red-siguiente">Marcada como "No le interesa".</p>}
              <div className="fila red-chico">
                <span className="sub chico">Último contacto: {haceCuanto(sel.ultimo_contacto)}</span>
                {est(sel) !== NO_INTERESA.id && <button className="enlace chico" onClick={() => actualizar(sel.id, { estado_contacto: NO_INTERESA.id, ultimo_contacto: hoy() })}>No le interesa</button>}
              </div>
            </section>

            <section>
              <h3>Propiedades que mandó <small className="sub">{propsSel.length}</small></h3>
              {propsSel.map((p) => <Link key={p.id} to={`/propiedades/${p.id}`} className="red-prop"><span>{p.direccion}</span><small className="sub">{p.barrio} · etapa {p.etapa_loacc}</small></Link>)}
              {nuevaProp ? (
                <div className="red-form-prop">
                  <input placeholder="Dirección" autoFocus autoComplete="off" value={nuevaProp.direccion} onChange={(e) => setNuevaProp({ ...nuevaProp, direccion: e.target.value })} />
                  <input placeholder="Precio pedido (USD)" autoComplete="off" inputMode="numeric" value={nuevaProp.precio} onChange={(e) => setNuevaProp({ ...nuevaProp, precio: e.target.value })} />
                  <div className="fila"><button className="primario chico" onClick={cargarPropiedad}>Cargar y analizar</button><button className="chico" onClick={() => setNuevaProp(null)}>Cancelar</button></div>
                </div>
              ) : <button className="chico" onClick={() => setNuevaProp({ direccion: "", precio: "" })}>+ Cargar propiedad que mandó</button>}
            </section>

            <section>
              <h3>Etiquetas</h3>
              <div className="red-etiquetas">
                {ETIQUETAS.map(([k, v]) => <button key={k} className={sel[k] ? "activa" : ""} aria-pressed={!!sel[k]} onClick={() => actualizar(sel.id, { [k]: !sel[k] })}>{v}</button>)}
              </div>
            </section>

            <section>
              <h3>Notas</h3>
              <textarea defaultValue={sel.notas || ""} key={sel.id + "notas"} rows={3} placeholder="Con quién hablaste, qué zonas trabaja, qué le interesa" onBlur={(e) => e.target.value !== (sel.notas || "") && actualizar(sel.id, { notas: e.target.value || null })} />
            </section>

            <details className="red-datos">
              <summary>Datos de contacto y cartera</summary>
              <div className="grilla-campos">
                {Campo({ label: "WhatsApp", k: "whatsapp" })}{Campo({ label: "Teléfono", k: "telefono" })}
                {Campo({ label: "Email", k: "email" })}{Campo({ label: "Web", k: "web" })}
                {Campo({ label: "Instagram", k: "instagram" })}{Campo({ label: "Barrio", k: "barrio" })}
                {Campo({ label: "Dirección", k: "direccion" })}{Campo({ label: "Zonas que trabaja", k: "zonas" })}
                {Campo({ label: "Propiedades en venta", k: "propiedades_venta", tipo: "number" })}
                {Campo({ label: "Ticket promedio (USD)", k: "ticket_promedio_usd", tipo: "number" })}
              </div>
              {sel.propiedades_venta && sel.ticket_promedio_usd ? <p className="sub chico">Cartera estimada: {usd(sel.propiedades_venta * sel.ticket_promedio_usd)}</p> : null}
              <p className="sub chico">Personas: {contactosSel.length ? contactosSel.map((c, i) => <span key={c.id}>{i ? ", " : ""}<Link to={`/contactos/${c.id}`}>{c.nombre}</Link></span>) : "ninguna vinculada (se asignan desde la ficha del contacto)"}.</p>
              <p className="sub chico">Origen: {sel.fuente || "—"}</p>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
