import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EMBUDOS, PERFILES, UNIDADES, etiqueta, fecha, supabase, type Perfil, type Unidad } from "../config";
import { puedeOperar, useYo } from "../main";

export type FilaContacto = {
  id: string; nombre: string; email: string | null; telefono: string | null; barrio: string | null; created_at: string;
  perfiles: Perfil[]; relaciones: { unidad: Unidad; embudo: string; etapa: string; estado: string; responsable: string | null; proximo_paso: string | null }[];
  ultima_actividad: string | null;
};

export type Filtro = { q: string; perfil: string; unidad: string; embudo: string; etapa: string; estado: string; barrio: string };
export const filtroVacio: Filtro = { q: "", perfil: "", unidad: "", embudo: "", etapa: "", estado: "", barrio: "" };

export function aplicarFiltro(filas: FilaContacto[], f: Filtro) {
  const q = f.q.trim().toLowerCase();
  return filas.filter((c) => {
    if (q && ![c.nombre, c.email, c.telefono, c.barrio].some((v) => v?.toLowerCase().includes(q))) return false;
    if (f.perfil && !c.perfiles.includes(f.perfil as Perfil)) return false;
    if (f.barrio && !c.barrio?.toLowerCase().includes(f.barrio.toLowerCase())) return false;
    const rels = c.relaciones.filter((r) => (!f.unidad || r.unidad === f.unidad) && (!f.embudo || r.embudo === f.embudo) && (!f.etapa || r.etapa === f.etapa) && (!f.estado || r.estado === f.estado));
    if ((f.unidad || f.embudo || f.etapa || f.estado) && !rels.length) return false;
    return true;
  });
}

export function useContactos() {
  const [filas, setFilas] = useState<FilaContacto[]>([]);
  const [cargando, setCargando] = useState(true);
  const recargar = async () => {
    setCargando(true);
    const todas: FilaContacto[] = [];
    for (let desde = 0; ; desde += 1000) {
      const { data } = await supabase.from("crm_vista_contactos").select("*").order("created_at", { ascending: false }).range(desde, desde + 999);
      todas.push(...((data as FilaContacto[]) || []));
      if (!data || data.length < 1000) break;
    }
    setFilas(todas); setCargando(false);
  };
  useEffect(() => { recargar(); }, []);
  return { filas, cargando, recargar };
}

export function exportarCSV(filas: FilaContacto[], nombre: string) {
  const cab = ["nombre", "telefono", "email", "barrio", "perfiles", "unidad", "embudo", "etapa", "estado"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lineas = filas.map((c) => {
    const r = c.relaciones[0];
    return [c.nombre, c.telefono, c.email, c.barrio, c.perfiles.join(" | "), r?.unidad, r?.embudo, r?.etapa, r?.estado].map(esc).join(",");
  });
  const blob = new Blob(["﻿" + [cab.join(","), ...lineas].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${nombre}.csv`; a.click();
}

export function BarraFiltros({ f, setF }: { f: Filtro; setF: (f: Filtro) => void }) {
  const embudos = EMBUDOS.filter((e) => !f.unidad || e.unidad === f.unidad);
  const etapas = EMBUDOS.find((e) => e.id === f.embudo)?.etapas || [];
  return (
    <div className="filtros">
      <input type="search" placeholder="Buscar nombre, teléfono, email o barrio" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
      <select value={f.perfil} onChange={(e) => setF({ ...f, perfil: e.target.value })}>
        <option value="">Todos los perfiles</option>
        {Object.entries(PERFILES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value, embudo: "", etapa: "" })}>
        <option value="">Todas las unidades</option>
        {Object.entries(UNIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select value={f.embudo} onChange={(e) => setF({ ...f, embudo: e.target.value, etapa: "" })}>
        <option value="">Todos los embudos</option>
        {embudos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      {f.embudo && (
        <select value={f.etapa} onChange={(e) => setF({ ...f, etapa: e.target.value })}>
          <option value="">Todas las etapas</option>
          {etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      )}
      <select value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value })}>
        <option value="">Cualquier estado</option>
        {["prospecto", "cliente_activo", "ex_cliente", "aliado", "descartado"].map((s) => <option key={s} value={s}>{etiqueta(s)}</option>)}
      </select>
      <input placeholder="Barrio" value={f.barrio} onChange={(e) => setF({ ...f, barrio: e.target.value })} style={{ width: 130 }} />
    </div>
  );
}

function NuevoContacto({ alCrear }: { alCrear: (id: string) => void }) {
  const yo = useYo();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState({ nombre: "", telefono: "", email: "", barrio: "", perfil: "vendedor_motivado", unidad: (yo.unidades[0] || "inmobiliaria") as Unidad, embudo: "" });
  const embudos = EMBUDOS.filter((e) => e.unidad === d.unidad);
  const guardar = async () => {
    const norm = d.telefono.replace(/\D/g, "").slice(-10) || null;
    const { data: c, error } = await supabase.from("crm_contacts").insert({ nombre: d.nombre, telefono: d.telefono || null, telefono_norm: norm, email: d.email || null, barrio: d.barrio || null }).select("id").single();
    if (error) { alert(error.message.includes("duplicate") ? "Ya existe un contacto con ese teléfono. Buscalo en la lista." : error.message); return; }
    await supabase.from("crm_contact_profiles").insert({ contact_id: c.id, perfil: d.perfil });
    const emb = d.embudo || embudos[0]?.id;
    if (emb) await supabase.from("crm_relations").insert({ contact_id: c.id, unidad: d.unidad, embudo: emb, responsable: yo.clave, origen: "carga manual" });
    await supabase.from("crm_activities").insert({ contact_id: c.id, unidad: d.unidad, tipo: "alta_manual", autor: yo.clave });
    alCrear(c.id);
  };
  if (!abierto) return <button className="primario" onClick={() => setAbierto(true)}>+ Nuevo contacto</button>;
  return (
    <div className="tarjeta" style={{ marginBottom: 14 }}>
      <div className="filtros">
        <input placeholder="Nombre *" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        <input placeholder="Teléfono" value={d.telefono} onChange={(e) => setD({ ...d, telefono: e.target.value })} />
        <input placeholder="Email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        <input placeholder="Barrio" value={d.barrio} onChange={(e) => setD({ ...d, barrio: e.target.value })} />
        <select value={d.perfil} onChange={(e) => setD({ ...d, perfil: e.target.value })}>
          {Object.entries(PERFILES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={d.unidad} onChange={(e) => setD({ ...d, unidad: e.target.value as Unidad, embudo: "" })}>
          {(Object.keys(UNIDADES) as Unidad[]).filter((u) => puedeOperar(yo, u)).map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}
        </select>
        <select value={d.embudo} onChange={(e) => setD({ ...d, embudo: e.target.value })}>
          {embudos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <button className="primario" disabled={!d.nombre} onClick={guardar}>Guardar</button>
        <button onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </div>
  );
}

export default function Contactos() {
  const { filas, cargando } = useContactos();
  const [f, setF] = useState<Filtro>(filtroVacio);
  const nav = useNavigate();
  const vis = useMemo(() => aplicarFiltro(filas, f), [filas, f]);
  return (
    <>
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <div><h1>Contactos</h1><p className="sub">Una ficha por persona en todo el holding. {cargando ? "Cargando…" : `${vis.length} de ${filas.length}`}</p></div>
        <div className="fila">
          <button onClick={() => exportarCSV(vis, "contactos-filtrados")}>Exportar CSV</button>
          <NuevoContacto alCrear={(id) => nav(`/contactos/${id}`)} />
        </div>
      </div>
      <BarraFiltros f={f} setF={setF} />
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Nombre</th><th>Perfil</th><th>Unidades y etapa</th><th>Teléfono</th><th>Barrio</th><th>Alta</th><th>Próximo paso</th></tr></thead>
          <tbody>
            {vis.slice(0, 500).map((c) => (
              <tr key={c.id} className="clic" onClick={() => nav(`/contactos/${c.id}`)}>
                <td><strong>{c.nombre}</strong><br /><small className="sub">{c.email}</small></td>
                <td>{c.perfiles.map((p) => <span key={p} className={`chip ${p}`}>{PERFILES[p]}</span>)}</td>
                <td>{c.relaciones.map((r, i) => <span key={i} className={`chip ${r.etapa}`}>{UNIDADES[r.unidad]}: {etiqueta(r.etapa)}</span>)}</td>
                <td>{c.telefono}</td>
                <td>{c.barrio}</td>
                <td>{fecha(c.created_at)}</td>
                <td>{c.relaciones.find((r) => r.proximo_paso)?.proximo_paso || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {vis.length > 500 && <p className="sub">Mostrando 500. Afiná con los filtros.</p>}
      </div>
    </>
  );
}
