import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, waLink } from "../config";
import { useYo } from "../main";

// Directorio único: todas las listas del holding en un solo lugar, para buscar, filtrar y exportar.
const LISTAS: [string, string][] = [["", "Todas las listas"], ["vendedor_motivado", "Vendedores"], ["comprador", "Compradores"], ["inversor", "Inversores"], ["inmobiliaria", "Inmobiliarias"], ["gremio", "Gremios"], ["contacto", "Contactos sueltos"]];

export default function Directorio() {
  const yo = useYo();
  const [filas, setFilas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState("");
  const [lista, setLista] = useState("");
  const [fuente, setFuente] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [pag, setPag] = useState(0);

  useEffect(() => {
    (async () => {
      const o: any[] = [];
      for (let p = 0; ; p += 1000) {
        const { data } = await supabase.from("crm_directorio").select("*").order("created_at", { ascending: false }).range(p, p + 999);
        o.push(...(data || [])); if (!data || data.length < 1000) break;
      }
      setFilas(o); setCargando(false);
    })();
  }, []);
  useEffect(() => setPag(0), [q, lista, fuente, estado, desde]);

  const fuentes = useMemo(() => [...new Set(filas.map((f) => (f.fuente || "").replace(/ \(.*\)$/, "")))].filter(Boolean).sort(), [filas]);
  const vis = useMemo(() => {
    const t = q.toLowerCase();
    return filas.filter((f) => (!lista || (f.lista || "").split(",").includes(lista))
      && (!fuente || (f.fuente || "").startsWith(fuente))
      && (!estado || (f.estado || "").includes(estado))
      && (!desde || (f.created_at || "") >= desde)
      && (!t || [f.nombre, f.telefono, f.email, f.empresa, f.barrio].some((v) => v?.toLowerCase().includes(t))));
  }, [filas, q, lista, fuente, estado, desde]);
  const cuenta = (l: string) => filas.filter((f) => !l || (f.lista || "").split(",").includes(l)).length;

  const exportar = () => {
    const esc = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const cab = ["lista", "nombre", "telefono", "email", "empresa", "barrio", "fuente", "estado", "alta"];
    const csv = [cab.join(","), ...vis.map((f) => [f.lista, f.nombre, f.telefono, f.email, f.empresa, f.barrio, f.fuente, f.estado, (f.created_at || "").slice(0, 10)].map(esc).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = `directorio-${lista || "todo"}.csv`; a.click();
  };

  return (
    <>
      <div className="cabecera">
        <div><h1>Directorio</h1><p className="sub">Todas las listas del holding en un solo lugar: {filas.length.toLocaleString("es-AR")} registros entre contactos, compradores, vendedores, inversores, inmobiliarias y gremios.</p></div>
        {yo.admin && <button onClick={exportar}>Exportar {vis.length.toLocaleString("es-AR")} a CSV</button>}
      </div>
      <div className="segmentos" style={{ marginBottom: 12 }}>
        {LISTAS.map(([k, v]) => <button key={k} className={lista === k ? "activo" : ""} onClick={() => setLista(k)}>{v} <small>{cuenta(k).toLocaleString("es-AR")}</small></button>)}
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar nombre, teléfono, email, empresa o barrio" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fuente} onChange={(e) => setFuente(e.target.value)} aria-label="Fuente"><option value="">Todas las fuentes</option>{fuentes.map((f) => <option key={f}>{f}</option>)}</select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          <option value="">Cualquier estado</option><option value="prospecto">Prospecto</option><option value="cliente_activo">Cliente activo</option><option value="descartado">Descartado</option><option value="sin_contactar">Sin contactar (inmobiliarias)</option><option value="contactada">Contactada</option>
        </select>
        <label className="fila chico">Alta desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
      </div>
      <p className="sub">{cargando ? "Cargando…" : `${vis.length.toLocaleString("es-AR")} resultados`}</p>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Nombre</th><th>Lista</th><th>Teléfono</th><th>Email</th><th>Barrio / rubro</th><th>Fuente</th><th></th></tr></thead>
          <tbody>
            {vis.slice(pag * 100, pag * 100 + 100).map((f) => {
              const wa = waLink(f.telefono);
              return (
                <tr key={f.id}>
                  <td><Link to={f.link}><strong>{f.nombre}</strong></Link>{f.empresa && f.empresa !== f.nombre && <><br /><small className="sub">{f.empresa}</small></>}</td>
                  <td>{(f.lista || "").split(",").map((l: string) => <span key={l} className={`chip ${l}`}>{LISTAS.find(([k]) => k === l)?.[1] || l}</span>)}</td>
                  <td>{f.telefono || "—"}</td><td><small>{f.email || "—"}</small></td><td>{f.barrio || "—"}</td><td><small>{f.fuente}</small></td>
                  <td>{wa && <a href={wa} target="_blank" rel="noreferrer"><button className="chico">WhatsApp</button></a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {vis.length > 100 && (
        <div className="fila" style={{ justifyContent: "center", margin: "12px 0" }}>
          <button className="chico" disabled={!pag} onClick={() => setPag(pag - 1)}>Anterior</button>
          <span className="sub">Página {pag + 1} de {Math.ceil(vis.length / 100)}</span>
          <button className="chico" disabled={(pag + 1) * 100 >= vis.length} onClick={() => setPag(pag + 1)}>Siguiente</button>
        </div>
      )}
    </>
  );
}
