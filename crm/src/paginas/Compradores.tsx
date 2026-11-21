import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EMBUDOS, PROXIMO_HITO, supabase, waLink } from "../config";
import { puedeOperar, useYo } from "../main";
import Descartar from "../componentes/Descartar";

// Compradores interesados que dejan sus datos en las campañas, agrupados por inmueble en venta.
type Lead = any;
const ETAPAS = EMBUDOS.find((e) => e.id === "compradores")!.etapas;
const listo = (l: Lead) => /listo/i.test(l.etapa_compra || "");
const capitalPropio = (l: Lead) => /listo/i.test(l.capital || "");
const quiereVisita = (l: Lead) => /visita/i.test(l.interes_visita || "");

// Segmento y secuencia propuesta según lo que contestó en el formulario
function segmento(l: Lead): { id: string; nombre: string; color: string } {
  if (listo(l) && capitalPropio(l)) return { id: "cierre", nombre: "Listo y con capital", color: "seg-cierre" };
  if (/financiar el 100/i.test(l.capital || "")) return { id: "financia100", nombre: "Necesita financiar todo", color: "seg-frio" };
  if (/financiar/i.test(l.capital || "")) return { id: "financia", nombre: "Financia una parte", color: "seg-tibio" };
  if (/averiguando|más adelante/i.test(l.etapa_compra || "")) return { id: "nutrir", nombre: "Averiguando", color: "seg-frio" };
  return { id: "activo", nombre: "Buscando activamente", color: "seg-tibio" };
}
function secuencia(l: Lead, inmueble: string): { dia: string; canal: string; texto: string }[] {
  const n = (l.nombre || "").split(" ")[0];
  const s = segmento(l).id;
  const base = `Hola ${n}, ¿cómo estás? Soy Matías de CIRE. Vi que consultaste por ${inmueble}.`;
  if (s === "cierre") return [
    { dia: "Hoy, en menos de 5 min", canal: "WhatsApp", texto: `${base} Te paso fotos y el video. ¿Te queda bien visitarlo ${quiereVisita(l) ? "esta semana" : "en los próximos días"}? Tengo turnos mañana y pasado.` },
    { dia: "Día 1", canal: "Llamada", texto: "Llamar para fijar día y hora de visita y confirmar forma de pago." },
    { dia: "Día 2", canal: "WhatsApp", texto: `${n}, te guardo un turno para ver ${inmueble}. ¿Mañana a la tarde o el sábado a la mañana?` },
    { dia: "Después de la visita", canal: "WhatsApp", texto: `¿Qué te pareció ${inmueble}? Si te cerró, armamos la oferta y se la presento al propietario hoy mismo.` },
  ];
  if (s === "financia" || s === "financia100") return [
    { dia: "Hoy, en menos de 5 min", canal: "WhatsApp", texto: `${base} Te paso fotos y video. Para ayudarte con la financiación: ¿ya tenés un crédito preaprobado o lo estás averiguando?` },
    { dia: "Día 2", canal: "WhatsApp", texto: `${n}, te dejo los requisitos generales para crédito hipotecario y con qué bancos conviene consultar. Las condiciones se validan con tu banco.` },
    { dia: "Día 5", canal: "Llamada", texto: "Llamar: ¿avanzó con el banco? Si tiene preaprobación, agendar visita." },
    { dia: "Día 10", canal: "WhatsApp", texto: `${n}, ¿cómo vas con el crédito? Si querés lo vemos juntos y coordinamos la visita.` },
  ];
  if (s === "nutrir") return [
    { dia: "Hoy", canal: "WhatsApp", texto: `${base} Te paso la info completa para que la tengas a mano. ¿Qué estás buscando exactamente: zona, ambientes y presupuesto?` },
    { dia: "Día 7", canal: "WhatsApp", texto: `${n}, entraron opciones parecidas a lo que buscás. ¿Querés que te las mande?` },
    { dia: "Día 21", canal: "WhatsApp", texto: `${n}, ¿seguís buscando? Si me decís zona y presupuesto, te aviso apenas entre algo.` },
  ];
  return [
    { dia: "Hoy, en menos de 5 min", canal: "WhatsApp", texto: `${base} Te paso fotos y video. ¿Querés coordinar una visita?` },
    { dia: "Día 1", canal: "Llamada", texto: "Llamar para calificar: forma de pago, plazo y quién decide." },
    { dia: "Día 3", canal: "WhatsApp", texto: `${n}, ¿pudiste ver el material de ${inmueble}? Tengo turnos de visita esta semana.` },
    { dia: "Día 7", canal: "WhatsApp", texto: `${n}, ¿lo seguís considerando? Si no es lo que buscás, contame qué necesitás y te paso opciones.` },
  ];
}

const nombrePropio = (n?: string | null) => (n || "").trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const oracion = (t: string) => { const x = t.trim(); return x.charAt(0).toUpperCase() + x.slice(1); };
const cuando = (s: string) => { const d = Math.floor((Date.now() - +new Date(s)) / 864e5); return d <= 0 ? "hoy" : d === 1 ? "ayer" : d < 30 ? `hace ${d} días` : new Date(s).toLocaleDateString("es-AR"); };

export default function Compradores() {
  const yo = useYo();
  const opera = puedeOperar(yo, "inmobiliaria");
  const [inm, setInm] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rels, setRels] = useState<Record<string, any>>({});
  const [sel, setSel] = useState<string>("");
  const [filtro, setFiltro] = useState<"todos" | "cierre" | "sin_tocar" | "descartados">("todos");
  const [abierto, setAbierto] = useState<Lead | null>(null);
  const [limite, setLimite] = useState(24);

  const cargar = async () => {
    const [i, l] = await Promise.all([
      supabase.from("crm_inmuebles_venta").select("*").order("orden"),
      supabase.from("crm_leads_meta").select("*").order("creado", { ascending: false }).limit(3000),
    ]);
    setInm(i.data || []); setLeads(l.data || []);
    const ids = [...new Set((l.data || []).map((x: any) => x.relation_id).filter(Boolean))];
    const mapa: Record<string, any> = {};
    for (let k = 0; k < ids.length; k += 300) {
      const { data } = await supabase.from("crm_relations").select("id,etapa,estado,updated_at").in("id", ids.slice(k, k + 300));
      (data || []).forEach((r: any) => { mapa[r.id] = r; });
    }
    setRels(mapa);
  };
  useEffect(() => { cargar(); }, []);

  const stats = (slug?: string) => {
    const ls = leads.filter((l) => !slug || l.inmueble === slug);
    const activos = ls.filter((l) => rels[l.relation_id]?.estado !== "descartado");
    return {
      total: ls.length, activos: activos.length,
      semana: ls.filter((l) => Date.now() - +new Date(l.creado) < 7 * 864e5).length,
      cierre: activos.filter((l) => segmento(l).id === "cierre").length,
      visita: activos.filter(quiereVisita).length,
      sinTocar: activos.filter((l) => (rels[l.relation_id]?.etapa || "nuevo") === "nuevo").length,
    };
  };
  const nombreInm = (slug: string) => inm.find((i) => i.slug === slug)?.nombre || slug;
  useEffect(() => setLimite(24), [sel, filtro]);
  const vis = useMemo(() => leads.filter((l) => {
    const r = rels[l.relation_id];
    if (sel && l.inmueble !== sel) return false;
    if (filtro === "descartados") return r?.estado === "descartado";
    if (r?.estado === "descartado") return false;
    if (filtro === "cierre") return segmento(l).id === "cierre";
    if (filtro === "sin_tocar") return (r?.etapa || "nuevo") === "nuevo";
    return true;
  }), [leads, rels, sel, filtro]);

  const moverEtapa = async (l: Lead, etapa: string) => {
    setRels((m) => ({ ...m, [l.relation_id]: { ...m[l.relation_id], etapa } }));
    await supabase.from("crm_relations").update({ etapa, updated_at: new Date().toISOString() }).eq("id", l.relation_id);
    await supabase.from("crm_activities").insert({ contact_id: l.contact_id, unidad: "inmobiliaria", tipo: "cambio_etapa", detalle: { embudo: "compradores", etapa } });
  };
  const registrarWa = async (l: Lead, texto: string) => {
    await supabase.from("crm_activities").insert({ contact_id: l.contact_id, unidad: "inmobiliaria", tipo: "whatsapp", detalle: { resultado: "Mensaje a comprador", texto } });
    if ((rels[l.relation_id]?.etapa || "nuevo") === "nuevo") moverEtapa(l, "contactado");
  };
  const g = stats();

  return (
    <>
      <div className="compr-hero">
        <div>
          <span className="compr-marca">CIRE Inmobiliaria</span>
          <h1>Compradores interesados</h1>
          <p>Cada persona que dejó sus datos en una campaña, agrupada por el inmueble que consultó. Los nuevos entran solos desde los formularios de Meta.</p>
        </div>
        <div className="compr-hero-num">
          <div><b>{g.activos}</b><span>consultas activas</span></div>
          <div><b>{g.cierre}</b><span>listos y con capital</span></div>
          <div><b className={g.sinTocar ? "naranja" : ""}>{g.sinTocar}</b><span>consultas sin contactar</span></div>
          <div><b>{g.semana}</b><span>nuevos esta semana</span></div>
        </div>
      </div>

      <div className="compr-inmuebles">
        <button className={`compr-inm ${!sel ? "activo" : ""}`} onClick={() => setSel("")}>
          <span className="compr-inm-nombre">Todos</span><span className="compr-inm-num">{g.activos}</span><span className="sub chico">{inm.length} inmuebles</span>
        </button>
        {inm.map((i) => {
          const s = stats(i.slug);
          return (
            <button key={i.slug} className={`compr-inm ${sel === i.slug ? "activo" : ""}`} onClick={() => setSel(i.slug)}>
              <span className="compr-inm-nombre">{i.nombre}</span>
              <span className="compr-inm-num">{s.activos}</span>
              <span className="sub chico">{i.barrio}{i.descripcion ? ` · ${i.descripcion}` : ""}</span>
              <span className="compr-calidad" title="Listos y con capital / quieren visitar / sin contactar">
                <i className="seg-cierre" style={{ flex: s.cierre || 0.0001 }} /><i className="seg-tibio" style={{ flex: Math.max(s.activos - s.cierre, 0) || 0.0001 }} />
              </span>
              <span className="chico">{s.cierre} listos · {s.visita} quieren visitar · <b className={s.sinTocar ? "naranja" : ""}>{s.sinTocar} sin tocar</b></span>
            </button>
          );
        })}
      </div>

      <div className="filtros">
        <div className="segmentos">
          {([["todos", "Todos"], ["cierre", "Listos y con capital"], ["sin_tocar", "Sin contactar"], ["descartados", "Descartados"]] as const).map(([k, v]) => <button key={k} className={filtro === k ? "activo" : ""} onClick={() => setFiltro(k)}>{v}</button>)}
        </div>
        <span className="sub">{vis.length} compradores{sel ? ` en ${nombreInm(sel)}` : ""}</span>
      </div>

      <div className="compr-lista">
        {vis.slice(0, limite).map((l) => {
          const r = rels[l.relation_id] || {}; const seg = segmento(l); const etapa = r.etapa || "nuevo";
          const primer = secuencia(l, nombreInm(l.inmueble))[0];
          const wa = waLink(l.telefono, primer.texto);
          return (
            <div key={l.lead_id} className="compr-card">
              <div className="compr-card-cab">
                <div>
                  <Link to={`/contactos/${l.contact_id}`} className="item-nombre">{nombrePropio(l.nombre) || "Sin nombre"}</Link>
                  <div className="sub chico" title={l.anuncio || ""}>{nombreInm(l.inmueble)} · {cuando(l.creado)}</div>
                </div>
                <span className={`compr-seg ${seg.color}`}>{seg.nombre}</span>
              </div>
              <div className="carta-meta">
                {[l.etapa_compra, l.capital, l.interes_visita].filter(Boolean).map((t) => <span key={t} className="chip">{oracion(t!)}</span>)}
              </div>
              <div className="compr-hito"><b>Próximo hito:</b> {PROXIMO_HITO.compradores[etapa] || "Cerrado"}</div>
              {opera && r.estado !== "descartado" && (
                <div className="compr-acc">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="boton chico primario" onClick={() => registrarWa(l, primer.texto)}>WhatsApp</a>}
                  <select className="chico" value={etapa} onChange={(e) => moverEtapa(l, e.target.value)} aria-label="Etapa">
                    {ETAPAS.filter((e) => e.id !== "descartado").map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                  <button className="chico" onClick={() => setAbierto(l)}>Secuencia</button>
                  <Descartar relationId={l.relation_id} nombre={(l.nombre || "").split(" ")[0]} alCambiar={cargar} />
                </div>
              )}
              {r.estado === "descartado" && <div style={{ marginTop: 6 }}><Descartar relationId={l.relation_id} descartado alCambiar={cargar} /></div>}
            </div>
          );
        })}
        {!vis.length && <p className="sub">No hay compradores con este filtro.</p>}
        {vis.length > limite && <button className="ver-mas compr-mas" onClick={() => setLimite(limite + 48)}>Ver {Math.min(48, vis.length - limite)} más · quedan {vis.length - limite}</button>}
      </div>

      {abierto && (
        <div className="modal-fondo" onClick={() => setAbierto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cab"><h2>Secuencia para {(abierto.nombre || "").split(" ")[0]}</h2><button className="icono" onClick={() => setAbierto(null)} aria-label="Cerrar">✕</button></div>
            <p className="sub chico">Propuesta según lo que contestó en el formulario: <b>{segmento(abierto).nombre}</b>. Cada mensaje se manda desde tu WhatsApp y queda registrado.</p>
            {secuencia(abierto, nombreInm(abierto.inmueble)).map((p, i) => {
              const wa = p.canal === "WhatsApp" ? waLink(abierto.telefono, p.texto) : null;
              return (
                <div key={i} className="item">
                  <div className="item-txt"><span className="item-nombre">{p.dia} · {p.canal}</span><small>{p.texto}</small></div>
                  <div className="item-acc">{wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => registrarWa(abierto, p.texto)}><button className="chico">Enviar</button></a>}{p.canal === "Llamada" && abierto.telefono && <a href={`tel:${abierto.telefono}`}><button className="chico">Llamar</button></a>}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
