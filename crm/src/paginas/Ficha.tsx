import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EMBUDOS, PERFILES, UNIDADES, etiqueta, fecha, supabase, waLink, type Perfil, type Unidad } from "../config";
import { puedeOperar, useYo } from "../main";

export default function Ficha() {
  const { id } = useParams();
  const yo = useYo();
  const [c, setC] = useState<any>(null);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [rels, setRels] = useState<any[]>([]);
  const [acts, setActs] = useState<any[]>([]);
  const [nota, setNota] = useState("");
  const [notaUnidad, setNotaUnidad] = useState<Unidad | "">("");
  const [nuevoPerfil, setNuevoPerfil] = useState("");

  const cargar = async () => {
    const [a, b, r, x] = await Promise.all([
      supabase.from("crm_contacts").select("*").eq("id", id).single(),
      supabase.from("crm_contact_profiles").select("*").eq("contact_id", id),
      supabase.from("crm_relations").select("*").eq("contact_id", id).order("created_at"),
      supabase.from("crm_activities").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    ]);
    setC(a.data); setPerfiles(b.data || []); setRels(r.data || []); setActs(x.data || []);
    const mias = (r.data || []).filter((z: any) => puedeOperar(yo, z.unidad));
    setNotaUnidad(mias[0]?.unidad || yo.unidades[0] || "");
  };
  useEffect(() => { cargar(); }, [id]);

  if (!c) return <div className="cargando">Cargando…</div>;

  const actualizarRel = async (rel: any, cambios: any) => {
    const { error } = await supabase.from("crm_relations").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", rel.id);
    if (error) return alert("No tenés permiso para operar esta unidad.");
    if (cambios.etapa) await supabase.from("crm_activities").insert({ contact_id: id, unidad: rel.unidad, tipo: "cambio_etapa", autor: yo.clave, detalle: { de: rel.etapa, a: cambios.etapa, embudo: rel.embudo } });
    cargar();
  };
  const agregarNota = async () => {
    if (!nota.trim()) return;
    const { error } = await supabase.from("crm_activities").insert({ contact_id: id, unidad: notaUnidad || null, tipo: "nota", autor: yo.clave, detalle: { texto: nota } });
    if (error) return alert("No tenés permiso para cargar notas en esa unidad.");
    setNota(""); cargar();
  };
  const sumarPerfil = async () => {
    if (!nuevoPerfil) return;
    await supabase.from("crm_contact_profiles").insert({ contact_id: id, perfil: nuevoPerfil });
    setNuevoPerfil(""); cargar();
  };
  const sumarUnidad = async (embudoId: string) => {
    const e = EMBUDOS.find((x) => x.id === embudoId)!;
    const { error } = await supabase.from("crm_relations").insert({ contact_id: id, unidad: e.unidad, embudo: e.id, responsable: yo.clave, origen: "cruce entre unidades" });
    if (error) return alert("No tenés permiso para abrir oportunidades en esa unidad.");
    await supabase.from("crm_activities").insert({ contact_id: id, unidad: e.unidad, tipo: "cruce_unidad", autor: yo.clave, detalle: { embudo: e.id } });
    cargar();
  };
  const wa = waLink(c.telefono, `Hola ${c.nombre.split(" ")[0]}, ¿cómo estás?`);
  const embudosLibres = EMBUDOS.filter((e) => !rels.some((r) => r.embudo === e.id) && puedeOperar(yo, e.unidad));

  return (
    <>
      <Link to="/contactos">← Contactos</Link>
      <h1 style={{ marginTop: 10 }}>{c.nombre}</h1>
      <p className="sub">{perfiles.map((p) => <span key={p.perfil} className={`chip ${p.perfil}`}>{PERFILES[p.perfil as Perfil]}</span>)} Alta {fecha(c.created_at)}</p>
      <div className="fila" style={{ marginBottom: 16 }}>
        {wa && <a href={wa} target="_blank" rel="noreferrer"><button className="primario">WhatsApp</button></a>}
        {c.telefono && <a href={`tel:${c.telefono}`}><button>Llamar</button></a>}
        {c.email && <a href={`mailto:${c.email}`}><button>Email</button></a>}
      </div>

      <div className="ficha">
        <div className="tarjeta">
          <h2 style={{ marginTop: 0 }}>Datos</h2>
          <dl className="datos">
            <dt>Teléfono</dt><dd>{c.telefono || "—"}</dd>
            <dt>Email</dt><dd>{c.email || "—"}</dd>
            <dt>Barrio</dt><dd>{c.barrio || "—"}</dd>
            {c.empresa && <><dt>Empresa</dt><dd>{c.empresa}</dd></>}
          </dl>
          {perfiles.map((p) => (
            <div key={p.perfil}>
              <h2>{PERFILES[p.perfil as Perfil]}</h2>
              <dl className="datos">
                {Object.entries(p.datos || {}).map(([k, v]) => <div key={k}><dt>{etiqueta(k)}</dt><dd>{String(v)}</dd></div>)}
              </dl>
            </div>
          ))}
          <div className="fila" style={{ marginTop: 14 }}>
            <select value={nuevoPerfil} onChange={(e) => setNuevoPerfil(e.target.value)}>
              <option value="">Etiquetar otro perfil…</option>
              {Object.entries(PERFILES).filter(([k]) => !perfiles.some((p) => p.perfil === k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button disabled={!nuevoPerfil} onClick={sumarPerfil}>Agregar</button>
          </div>
        </div>

        <div>
          <div className="tarjeta">
            <h2 style={{ marginTop: 0 }}>Unidades y embudos</h2>
            {rels.map((r) => {
              const emb = EMBUDOS.find((e) => e.id === r.embudo);
              const puede = puedeOperar(yo, r.unidad);
              return (
                <div key={r.id} style={{ borderBottom: "1px solid var(--linea)", padding: "10px 0" }}>
                  <strong>{UNIDADES[r.unidad as Unidad]}</strong> · {emb?.nombre || r.embudo} <small className="sub">· origen: {r.origen || "—"} · responsable: {r.responsable || "—"}</small>
                  <div className="fila" style={{ marginTop: 6 }}>
                    <select disabled={!puede} value={r.etapa} onChange={(e) => actualizarRel(r, { etapa: e.target.value, estado: e.target.value === "descartado" || e.target.value === "perdido" ? "descartado" : r.estado === "descartado" ? "prospecto" : r.estado })}>
                      {(emb?.etapas || [{ id: r.etapa, nombre: r.etapa }]).map((et) => <option key={et.id} value={et.id}>{et.nombre}</option>)}
                    </select>
                    <select disabled={!puede} value={r.estado} onChange={(e) => actualizarRel(r, { estado: e.target.value })}>
                      {["prospecto", "cliente_activo", "ex_cliente", "aliado", "descartado"].map((s) => <option key={s} value={s}>{etiqueta(s)}</option>)}
                    </select>
                  </div>
                  <div className="fila" style={{ marginTop: 6 }}>
                    <input disabled={!puede} style={{ flex: 1 }} placeholder="Próximo paso" defaultValue={r.proximo_paso || ""} onBlur={(e) => e.target.value !== (r.proximo_paso || "") && actualizarRel(r, { proximo_paso: e.target.value || null })} />
                    <input disabled={!puede} type="date" defaultValue={r.proximo_paso_fecha?.slice(0, 10) || ""} onChange={(e) => actualizarRel(r, { proximo_paso_fecha: e.target.value || null })} />
                  </div>
                  {!puede && <small className="sub">Solo lectura: no operás esta unidad.</small>}
                </div>
              );
            })}
            {embudosLibres.length > 0 && (
              <div className="fila" style={{ marginTop: 10 }}>
                <select id="cruce" defaultValue="">
                  <option value="" disabled>Abrir oportunidad en otra unidad…</option>
                  {embudosLibres.map((e) => <option key={e.id} value={e.id}>{UNIDADES[e.unidad]} · {e.nombre}</option>)}
                </select>
                <button onClick={() => { const v = (document.getElementById("cruce") as HTMLSelectElement).value; if (v) sumarUnidad(v); }}>Abrir</button>
              </div>
            )}
          </div>

          <div className="tarjeta" style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>Historial</h2>
            <textarea placeholder="Nota de la llamada, acuerdo, dato relevante…" value={nota} onChange={(e) => setNota(e.target.value)} />
            <div className="fila" style={{ margin: "8px 0 14px" }}>
              <select value={notaUnidad} onChange={(e) => setNotaUnidad(e.target.value as Unidad)}>
                {(Object.keys(UNIDADES) as Unidad[]).filter((u) => puedeOperar(yo, u)).map((u) => <option key={u} value={u}>{UNIDADES[u]}</option>)}
              </select>
              <button className="primario" onClick={agregarNota}>Guardar nota</button>
            </div>
            <ul className="linea-tiempo">
              {acts.map((a) => (
                <li key={a.id}>
                  <small>{new Date(a.created_at).toLocaleString("es-AR")} · {a.autor}{a.unidad ? ` · ${UNIDADES[a.unidad as Unidad]}` : ""}</small>
                  {a.tipo === "nota" ? a.detalle?.texto
                    : a.tipo === "cambio_etapa" ? `Etapa: ${etiqueta(a.detalle?.de || "")} → ${etiqueta(a.detalle?.a || "")}`
                    : a.tipo === "formulario_web" ? `Completó el formulario de ${a.detalle?.landing}`
                    : a.tipo === "importado" ? `Importado de ${a.detalle?.fuente}${a.detalle?.estado_original ? ` (estado: ${a.detalle.estado_original})` : ""}`
                    : a.tipo === "sin_accion_post_formulario" ? <span className="alerta">{a.detalle?.nota}</span>
                    : etiqueta(a.tipo)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
