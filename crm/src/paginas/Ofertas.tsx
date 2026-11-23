import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { diaBA, fecha, supabase, usd } from "../config";
import { puedeOperar, useYo } from "../main";
import { metaPlan260 } from "./Inicio";

const CARPETA = "https://drive.google.com/drive/folders/1k-ufFplHLOBMDrXdQbBbCEDWBVQ-7xSd";
const PLANTILLA = "https://docs.google.com/document/d/1EjkWPgxlH8iV1EzK0wiJXZLtKp2tCXHPXT1TvG90Aeg/edit";
const FIN_PLAN = new Date(2026, 11, 18);

// Un solo estado por oferta. La etapa LOACC se calcula en la base a partir del estado y de "visitada".
const ESTADOS: [string, string][] = [
  ["enviada", "Esperando respuesta"],
  ["contraoferta", "Contraoferta"],
  ["negociando", "Negociando"],
  ["aceptada", "Aceptada"],
  ["rechazada", "Rechazada"],
  ["sin_respuesta", "Sin respuesta (cerrada)"],
  ["cerrada", "Comprada"],
];
const NOMBRE = Object.fromEntries(ESTADOS);
const ABIERTOS = ["enviada", "contraoferta", "negociando", "aceptada"];
const RESPONDIO = ["contraoferta", "negociando", "aceptada", "rechazada", "cerrada"];

const dia = (d: Date) => diaBA(d);
const diasDesde = (f: string) => Math.max(0, Math.round((Date.now() - new Date(f + "T12:00").getTime()) / 864e5));
const FERIADOS = new Set(["2026-12-07", "2026-12-08", "2026-12-25", "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-24", "2027-03-25", "2027-03-26", "2027-04-02"]);
const habilesEntre = (desde: Date, hasta: Date) => {
  let n = 0; const d = new Date(desde); d.setHours(12, 0, 0, 0);
  while (d <= hasta) { if (d.getDay() % 6 !== 0 && !FERIADOS.has(diaBA(d))) n++; d.setDate(d.getDate() + 1); }
  return n;
};
const sumarHabiles = (n: number) => { const d = new Date(); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0 && !FERIADOS.has(diaBA(d))) n--; } return dia(d); };
const lunes = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const mediana = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)} %`;

export default function Ofertas() {
  const yo = useYo();
  const puede = puedeOperar(yo, "inmobiliaria") || puedeOperar(yo, "desarrolladora");
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("abiertas");
  const [nueva, setNueva] = useState<any | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const cargar = () => supabase.from("crm_ofertas").select("*, crm_contacts(id,nombre,telefono)").order("fecha", { ascending: false }).then(({ data }) => setOfertas(data || []));
  useEffect(() => { cargar(); }, []);
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 3500); };

  const actualizar = async (o: any, cambios: any, msg?: string) => {
    const { error } = await supabase.from("crm_ofertas").update(cambios).eq("id", o.id);
    if (error) return avisar(error.code === "42501" ? "No tenés permiso para editar ofertas." : `No se pudo guardar: ${error.message}`);
    if (msg) avisar(msg);
    cargar();
  };
  const guardarNueva = async () => {
    const { reemplaza, ...datos } = nueva;
    const fila = { ...datos, monto_usd: Number(datos.monto_usd), precio_publicado_usd: datos.precio_publicado_usd ? Number(datos.precio_publicado_usd) : null, responsable: yo.clave, reemplaza_id: reemplaza?.id || null };
    const { data, error } = await supabase.from("crm_ofertas").insert(fila).select("id").single();
    if (error) return avisar(error.message);
    // La oferta anterior se cierra según lo que pasó: si respondieron (contraoferta o negociación), cuenta como respondida y rechazada; si no, sin respuesta
    if (reemplaza) await supabase.from("crm_ofertas").update({ estado: ["contraoferta", "negociando"].includes(reemplaza.estado) ? "rechazada" : "sin_respuesta" }).eq("id", reemplaza.id);
    setNueva(null); setSelId(data?.id || null); avisar("Oferta registrada."); cargar();
  };
  const recontactar = async (o: any) => {
    await supabase.from("crm_tareas").insert({ contact_id: o.contact_id || null, unidad: "desarrolladora", tipo: "llamar", titulo: `Recontactar por la oferta de ${o.direccion} (${usd(o.monto_usd)})`, vence: new Date().toISOString(), responsable: yo.clave, prioridad: "alta", origen: "ofertas" });
    await actualizar(o, { recontactos: (o.recontactos || 0) + 1, recontactado_at: new Date().toISOString(), vence: sumarHabiles(3) }, "Tarea creada para hoy en Mi día. La oferta vuelve a vencer en 3 días hábiles.");
  };
  const reofertar = (o: any, monto?: number) => setNueva({
    fecha: dia(new Date()), direccion: o.direccion, barrio: o.barrio || "", localidad: o.localidad || "CABA", monto_usd: monto ?? o.monto_usd,
    precio_publicado_usd: o.precio_publicado_usd || "", inmobiliaria: o.inmobiliaria || "", doc_url: "", estado: "enviada",
    contact_id: o.contact_id || null, propiedad_id: o.propiedad_id || null, reemplaza: o,
  });
  const recordar = async (o: any) => {
    await supabase.from("crm_tareas").insert({ contact_id: o.contact_id || null, unidad: "desarrolladora", tipo: "seguimiento", titulo: `La oferta de ${o.direccion} vence ${fecha(o.vence + "T12:00")}: pedir respuesta`, vence: new Date().toISOString(), responsable: yo.clave, prioridad: "normal", origen: "ofertas" });
    avisar("Recordatorio creado en Mi día.");
  };

  const hoy = dia(new Date());
  const en48 = dia(new Date(Date.now() + 2 * 864e5));
  const plan = ofertas.filter((o) => o.cuenta_plan_260);
  const sel = ofertas.find((o) => o.id === selId) || null;

  // Bandeja: lo que pide una decisión hoy
  const contras = ofertas.filter((o) => o.estado === "contraoferta");
  const vencidas = ofertas.filter((o) => ["enviada", "negociando"].includes(o.estado) && o.vence && o.vence < hoy);
  const porVencer = ofertas.filter((o) => ["enviada", "negociando"].includes(o.estado) && o.vence && o.vence >= hoy && o.vence <= en48);
  const pendientes = contras.length + vencidas.length + porVencer.length;

  // Ritmo
  const meta = metaPlan260();
  const semanas = useMemo(() => {
    const l0 = lunes(new Date());
    return [3, 2, 1, 0].map((k) => {
      const ini = new Date(l0); ini.setDate(ini.getDate() - 7 * k);
      const fin = new Date(ini); fin.setDate(fin.getDate() + 7);
      return { ini, n: plan.filter((o) => { const f = new Date(o.fecha + "T12:00"); return f >= ini && f < fin; }).length };
    });
  }, [ofertas]);
  const estaSemana = semanas[3].n;
  const desdeRitmo = new Date(); if (desdeRitmo.getHours() >= 12) desdeRitmo.setDate(desdeRitmo.getDate() + 1);
  const habilesRestantes = Math.max(1, habilesEntre(desdeRitmo, FIN_PLAN));
  const necesario = Math.ceil((260 - plan.length) / habilesRestantes);
  const maxSem = Math.max(1, ...semanas.map((s) => s.n));

  // Precio y respuesta (solo plan, para que todos los números hablen del mismo universo)
  const med = mediana(plan.map((o) => Number(o.monto_usd)));
  const conPub = plan.filter((o) => Number(o.precio_publicado_usd) > 0);
  const descuento = mediana(conPub.map((o) => (Number(o.monto_usd) / Number(o.precio_publicado_usd) - 1) * 100));
  // Tasa de respuesta sobre una sola cohorte: ofertas del plan ya resueltas (respondieron) o con el plazo vencido
  const cohorte = plan.filter((o) => RESPONDIO.includes(o.estado) || o.estado === "sin_respuesta" || (o.vence && o.vence < hoy));
  const respondieronCohorte = cohorte.filter((o) => RESPONDIO.includes(o.estado)).length;
  const respondieron = plan.filter((o) => RESPONDIO.includes(o.estado)).length;
  const embudo = [
    ["Ofertas", plan.length],
    ["Respondieron", respondieron],
    ["Visitadas", plan.filter((o) => o.visitada || ["C1", "C2"].includes(o.etapa_loacc)).length],
    ["Contrato", plan.filter((o) => ["C1", "C2"].includes(o.etapa_loacc)).length],
    ["Cierre", plan.filter((o) => o.etapa_loacc === "C2").length],
  ] as [string, number][];

  const vis = ofertas.filter((o) => filtro === "todas" || (filtro === "abiertas" ? ABIERTOS.includes(o.estado) : o.cuenta_plan_260));
  const contraparte = (o: any) => o.crm_contacts?.nombre || o.inmobiliaria || null;
  const sobrePub = (o: any) => Number(o.precio_publicado_usd) > 0 ? (Number(o.monto_usd) / Number(o.precio_publicado_usd) - 1) * 100 : null;

  const ItemBandeja = ({ o, children, detalle }: { o: any; children: any; detalle: any }) => (
    <div className="of-item">
      <button className="of-item-txt" onClick={() => setSelId(o.id)}>
        <strong>{o.direccion}</strong>
        <small className="sub">{detalle}</small>
      </button>
      {puede && <div className="of-item-acc">{children}</div>}
    </div>
  );

  return (
    <>
      <div className="cabecera">
        <div><h1>Ofertas · Plan 260</h1><p className="sub">Toda oferta con número se registra acá. El documento vive en la carpeta de ofertas de Drive.</p></div>
        <div className="fila">
          <a className="boton" href={PLANTILLA} target="_blank" rel="noreferrer">Plantilla</a>
          <a className="boton" href={CARPETA} target="_blank" rel="noreferrer">Carpeta de Drive</a>
          {puede && <button className="primario" onClick={() => setNueva({ fecha: hoy, direccion: "", barrio: "", localidad: "CABA", monto_usd: "", precio_publicado_usd: "", estado: "enviada", doc_url: "" })}>+ Registrar oferta</button>}
        </div>
      </div>
      {aviso && <p className="of-aviso" role="status">{aviso}</p>}

      <div className="of-kpis">
        <div className="tarjeta of-ritmo">
          <div className="titulo">Ritmo</div>
          <div className="of-ritmo-fila">
            <div><b className={estaSemana === 0 ? "alerta" : ""}>{estaSemana}</b><span>ofertas esta semana</span></div>
            <div><b>{necesario}</b><span>por día hábil para llegar a 260 el 18/12</span></div>
          </div>
          <div className="of-barras" aria-label="Ofertas por semana, últimas 4">
            {semanas.map((s, i) => (
              <div key={i} title={`Semana del ${s.ini.toLocaleDateString("es-AR")}: ${s.n}`}>
                <i style={{ height: `${(s.n / maxSem) * 100}%` }} className={i === 3 ? "actual" : ""} />
                <small>{i === 3 ? "esta" : s.ini.toLocaleDateString("es-AR", { day: "numeric", month: "numeric" })}</small>
              </div>
            ))}
          </div>
          <small className="sub">{plan.length} de 260 desde el 5/10 · el anotador marcaba {meta} a hoy</small>
        </div>

        <div className="tarjeta of-precio">
          <div className="titulo">Cómo estás ofertando</div>
          <div className="of-dato"><b>{med != null ? usd(Math.round(med)) : "—"}</b><span>oferta mediana del plan</span></div>
          <div className="of-dato">
            <b>{descuento != null ? pct(descuento) : "—"}</b>
            <span>{descuento != null ? `sobre el precio publicado (${conPub.length} de ${plan.length} con precio)` : "sobre el precio publicado: cargalo al registrar cada oferta"}</span>
          </div>
          <div className="of-dato"><b>{cohorte.length ? `${Math.round((respondieronCohorte / cohorte.length) * 100)} %` : "—"}</b><span>respondieron ({respondieronCohorte} de {cohorte.length} con plazo cumplido)</span></div>
        </div>

        <div className="tarjeta of-embudo">
          <div className="titulo">Embudo del plan</div>
          {embudo.map(([n, v]) => (
            <div key={n} className="of-embudo-fila"><span>{n}</span><i style={{ width: `${plan.length ? (v / plan.length) * 100 : 0}%` }} /><b>{v}</b></div>
          ))}
          <small className="sub">Con menos de 3 semanas de muestra, anotar sin sacar conclusiones.</small>
        </div>
      </div>

      {nueva && (
        <div className="tarjeta of-nueva">
          <h2>{nueva.reemplaza ? `Volver a ofertar: ${nueva.reemplaza.direccion}` : "Registrar oferta"}</h2>
          <div className="of-form">
            <label>Fecha<input type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} /></label>
            <label className="ancho">Dirección *<input value={nueva.direccion} onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })} /></label>
            <label>Barrio<input value={nueva.barrio} onChange={(e) => setNueva({ ...nueva, barrio: e.target.value })} /></label>
            <label>Monto USD *<input type="number" value={nueva.monto_usd} onChange={(e) => setNueva({ ...nueva, monto_usd: e.target.value })} /></label>
            <label>Precio publicado USD<input type="number" value={nueva.precio_publicado_usd} onChange={(e) => setNueva({ ...nueva, precio_publicado_usd: e.target.value })} /></label>
            <label>Inmobiliaria o dueño<input value={nueva.inmobiliaria || ""} onChange={(e) => setNueva({ ...nueva, inmobiliaria: e.target.value })} /></label>
            <label className="ancho">Link al documento<input value={nueva.doc_url} onChange={(e) => setNueva({ ...nueva, doc_url: e.target.value })} /></label>
          </div>
          {Number(nueva.precio_publicado_usd) > 0 && Number(nueva.monto_usd) > 0 && <p className="sub">Estás ofertando {pct((Number(nueva.monto_usd) / Number(nueva.precio_publicado_usd) - 1) * 100)} sobre el publicado.</p>}
          <div className="fila">
            <button className="primario" disabled={!nueva.direccion || !nueva.monto_usd} onClick={guardarNueva}>Registrar oferta</button>
            <button onClick={() => setNueva(null)}>Cancelar</button>
            <small className="sub">Las ofertas verbales con número también cuentan.{nueva.reemplaza ? " La oferta anterior queda cerrada sin respuesta." : ""}</small>
          </div>
        </div>
      )}

      <section className="tarjeta of-bandeja">
        <h2>Para mover hoy <small className="sub">{pendientes ? `${pendientes} ofertas piden una decisión` : "Nada pendiente: todo está en plazo."}</small></h2>
        {contras.length > 0 && <>
          <h3>Contraofertas para responder</h3>
          {contras.map((o) => {
            const brecha = o.contraoferta_usd ? (Number(o.contraoferta_usd) / Number(o.monto_usd) - 1) * 100 : null;
            return (
              <ItemBandeja key={o.id} o={o} detalle={<>Ofertaste {usd(o.monto_usd)} · piden {usd(o.contraoferta_usd)}{brecha != null && <b className="of-brecha"> {pct(brecha)}</b>}{o.respuesta ? ` · "${o.respuesta}"` : ""}</>}>
                <button className="chico" onClick={() => reofertar(o, Math.round((Number(o.monto_usd) + Number(o.contraoferta_usd || o.monto_usd)) / 2))}>Subir oferta</button>
                <button className="chico" onClick={() => actualizar(o, { estado: "negociando" }, "Quedó en negociación con tu oferta original.")}>Sostener</button>
                <button className="chico" onClick={() => actualizar(o, { estado: "rechazada" }, "Oferta soltada.")}>Soltar</button>
              </ItemBandeja>
            );
          })}
        </>}
        {vencidas.length > 0 && <>
          <h3>Vencidas sin respuesta</h3>
          {vencidas.map((o) => (
            <ItemBandeja key={o.id} o={o} detalle={<>{o.estado === "negociando" ? "Negociando · " : ""}{usd(o.monto_usd)} · venció hace {diasDesde(o.vence)} días{o.recontactos ? ` · recontactada ${o.recontactos} ${o.recontactos === 1 ? "vez" : "veces"}` : ""}{contraparte(o) ? ` · ${contraparte(o)}` : ""}</>}>
              <button className="chico" onClick={() => recontactar(o)}>Recontactar</button>
              <button className="chico" onClick={() => reofertar(o)}>Volver a ofertar</button>
              <button className="chico" onClick={() => actualizar(o, { estado: "sin_respuesta" }, "Oferta cerrada sin respuesta.")}>Cerrar</button>
            </ItemBandeja>
          ))}
        </>}
        {porVencer.length > 0 && <>
          <h3>Vencen en 48 horas</h3>
          {porVencer.map((o) => (
            <ItemBandeja key={o.id} o={o} detalle={<>{usd(o.monto_usd)} · vence {o.vence === hoy ? "hoy" : fecha(o.vence + "T12:00")}{contraparte(o) ? ` · ${contraparte(o)}` : ""}</>}>
              <button className="chico" onClick={() => recordar(o)}>Pedir respuesta</button>
            </ItemBandeja>
          ))}
        </>}
      </section>

      <div className="segmentos" style={{ marginBottom: 12 }}>
        {[["abiertas", "Abiertas"], ["plan", "Plan 260"], ["todas", "Todas"]].map(([f, n]) => <button key={f} className={filtro === f ? "activo" : ""} onClick={() => setFiltro(f)}>{n}</button>)}
      </div>

      <div className={`red-cuerpo ${sel ? "con-panel" : ""}`}>
        <div className="tarjeta of-lista">
          <table className="of-tabla">
            <thead><tr><th>Propiedad</th><th className="num">Oferta</th><th className="num">Días</th><th>Estado</th></tr></thead>
            <tbody>
              {vis.map((o) => {
                const sp = sobrePub(o);
                const venc = o.estado === "enviada" && o.vence && o.vence < hoy;
                return (
                  <tr key={o.id} className={`clic ${selId === o.id ? "sel" : ""}`} onClick={() => setSelId(o.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelId(o.id)}>
                    <td className="of-prop"><strong>{o.direccion}</strong><small className="sub">{[o.barrio, contraparte(o)].filter(Boolean).join(" · ") || "Sin contraparte"}</small></td>
                    <td className="num">{usd(o.monto_usd)}{sp != null && <small className="sub">{pct(sp)} s/ publicado</small>}</td>
                    <td className="num"><span title={`Enviada el ${fecha(o.fecha + "T12:00")}`}>{diasDesde(o.fecha)}</span></td>
                    <td><span className={`of-estado ${o.estado} ${venc ? "vencida" : ""}`}>{venc ? "Vencida" : NOMBRE[o.estado] || o.estado}</span></td>
                  </tr>
                );
              })}
              {!vis.length && <tr><td colSpan={4} className="sub">No hay ofertas en esta vista.</td></tr>}
            </tbody>
          </table>
        </div>

        {sel && (
          <section className="red-panel tarjeta" aria-label={`Oferta de ${sel.direccion}`}>
            <div className="red-panel-cab">
              <div>
                <h2>{sel.direccion}</h2>
                <p className="sub">{[sel.barrio, `ofertada el ${fecha(sel.fecha + "T12:00")}`, sel.vence && `vence ${fecha(sel.vence + "T12:00")}`].filter(Boolean).join(" · ")}</p>
              </div>
              <button className="chico" onClick={() => setSelId(null)} aria-label="Cerrar panel">✕</button>
            </div>
            <Panel o={sel} puede={puede} actualizar={actualizar} />
            {puede && (
              <div className="fila">
                <button className="chico" onClick={() => recontactar(sel)}>Recontactar</button>
                <button className="chico" onClick={() => reofertar(sel)}>Volver a ofertar</button>
                {sel.doc_url && <a className="boton chico" href={sel.doc_url} target="_blank" rel="noreferrer">Abrir documento</a>}
                {sel.propiedad_id && <Link className="boton chico" to={`/propiedades/${sel.propiedad_id}`}>Ver propiedad</Link>}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

// Panel de edición: los campos se guardan al salir de cada uno
function Panel({ o, puede, actualizar }: { o: any; puede: boolean; actualizar: (o: any, c: any, m?: string) => Promise<any> }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any[]>([]);
  useEffect(() => {
    if (q.trim().length < 3) { setRes([]); return; }
    const t = setTimeout(() => supabase.from("crm_contacts").select("id,nombre,telefono").ilike("nombre", `%${q.trim()}%`).limit(6).then(({ data }) => setRes(data || [])), 250);
    return () => clearTimeout(t);
  }, [q]);
  const num = (v: string) => (v ? Number(v) : null);
  const brecha = o.contraoferta_usd ? (Number(o.contraoferta_usd) / Number(o.monto_usd) - 1) * 100 : null;
  return (
    <div className="of-panel" key={o.id}>
      <label>Estado
        <select disabled={!puede} value={o.estado} onChange={(e) => actualizar(o, { estado: e.target.value })}>
          {ESTADOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
        </select>
      </label>
      <label className="of-check"><input type="checkbox" disabled={!puede} checked={!!o.visitada} onChange={(e) => actualizar(o, { visitada: e.target.checked })} /> Ya la visitamos</label>
      <div className="of-panel-dos">
        <label>Oferta USD<input type="number" disabled={!puede} defaultValue={o.monto_usd} onBlur={(e) => Number(e.target.value) !== Number(o.monto_usd) && actualizar(o, { monto_usd: num(e.target.value) })} /></label>
        <label>Publicado USD<input type="number" disabled={!puede} defaultValue={o.precio_publicado_usd || ""} onBlur={(e) => num(e.target.value) !== (o.precio_publicado_usd != null ? Number(o.precio_publicado_usd) : null) && actualizar(o, { precio_publicado_usd: num(e.target.value) })} /></label>
        <label>Contraoferta USD<input type="number" disabled={!puede} defaultValue={o.contraoferta_usd || ""} onBlur={(e) => num(e.target.value) !== (o.contraoferta_usd != null ? Number(o.contraoferta_usd) : null) && actualizar(o, { contraoferta_usd: num(e.target.value) })} /></label>
        <label>Vence<input type="date" disabled={!puede} defaultValue={o.vence || ""} onBlur={(e) => e.target.value && e.target.value !== o.vence && actualizar(o, { vence: e.target.value })} /></label>
      </div>
      {brecha != null && <p className="sub">Piden {pct(brecha)} sobre tu oferta.</p>}
      <label>Qué respondió<textarea rows={2} disabled={!puede} defaultValue={o.respuesta || ""} onBlur={(e) => e.target.value !== (o.respuesta || "") && actualizar(o, { respuesta: e.target.value || null })} /></label>
      <label>Inmobiliaria o dueño<input disabled={!puede} defaultValue={o.inmobiliaria || ""} onBlur={(e) => e.target.value !== (o.inmobiliaria || "") && actualizar(o, { inmobiliaria: e.target.value || null })} /></label>
      <div>
        <span className="of-etq">Contacto</span>
        {o.crm_contacts ? (
          <p className="fila"><Link to={`/contactos/${o.crm_contacts.id}`}>{o.crm_contacts.nombre}</Link>{puede && <button className="chico" onClick={() => actualizar(o, { contact_id: null })}>Quitar</button>}</p>
        ) : puede ? (
          <>
            <input type="search" placeholder="Buscar en contactos para vincular" value={q} onChange={(e) => setQ(e.target.value)} />
            {res.map((c) => <button key={c.id} className="of-res" onClick={() => { setQ(""); actualizar(o, { contact_id: c.id }, `Vinculada a ${c.nombre}.`); }}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</button>)}
          </>
        ) : <p className="sub">Sin contacto vinculado.</p>}
      </div>
      <label>Link al documento<input disabled={!puede} defaultValue={o.doc_url || ""} onBlur={(e) => e.target.value !== (o.doc_url || "") && actualizar(o, { doc_url: e.target.value || null })} /></label>
      <label>Notas<textarea rows={3} disabled={!puede} defaultValue={o.observaciones || ""} onBlur={(e) => e.target.value !== (o.observaciones || "") && actualizar(o, { observaciones: e.target.value || null })} /></label>
    </div>
  );
}
