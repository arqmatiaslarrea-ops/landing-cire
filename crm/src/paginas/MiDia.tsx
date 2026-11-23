import Descartar from "../componentes/Descartar";
import CarteraSinAtender from "../componentes/CarteraSinAtender";
import { Fragment } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UNIDADES, fecha, supabase, usd, waLink, type Unidad, hoyBA, diaBA } from "../config";
import { puedeOperar, useYo } from "../main";
import Registro, { type ContextoRegistro } from "../componentes/Registro";
import Temperatura, { hace } from "../componentes/Temperatura";

type Rel = { id: string; contact_id: string; nombre: string; telefono: string | null; barrio: string | null; unidad: Unidad; embudo: string; etapa: string; estado: string;
  responsable: string | null; created_at: string; primer_contacto_at: string | null; ultima_gestion: string | null; temperatura: number; situacion: string | null; urgencia_form: string | null; semaforo_desc: string | null };

const inicioHoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const finHoy = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

export default function MiDia() {
  const yo = useYo();
  const [equipo, setEquipo] = useState(false);
  const [tareas, setTareas] = useState<any[]>([]);
  const [rels, setRels] = useState<Rel[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [registro, setRegistro] = useState<ContextoRegistro | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = async () => {
    let qt = supabase.from("crm_tareas").select("*, crm_contacts(nombre,telefono)").eq("hecha", false).lte("vence", new Date(Date.now() + 7 * 864e5).toISOString()).order("vence");
    if (!equipo) qt = qt.eq("responsable", yo.clave);
    const [t, r, o] = await Promise.all([
      qt,
      supabase.from("crm_vista_relaciones").select("id,contact_id,nombre,telefono,barrio,unidad,embudo,etapa,estado,responsable,created_at,primer_contacto_at,ultima_gestion,temperatura,situacion,urgencia_form,semaforo_desc").neq("estado", "descartado").limit(5000),
      supabase.from("crm_ofertas").select("*").in("estado", ["enviada", "negociando", "contraoferta"]).order("vence"),
    ]);
    setTareas(t.data || []);
    setRels(((r.data as Rel[]) || []).filter((x) => puedeOperar(yo, x.unidad) && (equipo || !x.responsable || x.responsable === yo.clave)));
    setOfertas(o.data || []);
  };
  useEffect(() => { cargar(); }, [equipo]);

  const relsDe = (contactId: string) => rels.filter((r) => r.contact_id === contactId).map((r) => ({ id: r.id, unidad: r.unidad, embudo: r.embudo }));
  const abrir = (contactId: string, nombre: string, telefono: string | null, tareaId?: string, tipoInicial?: string, relFallback?: Rel) => {
    const rr = relsDe(contactId);
    setRegistro({ contactId, nombre, telefono, tareaId, tipoInicial, relaciones: rr.length ? rr : relFallback ? [{ id: relFallback.id, unidad: relFallback.unidad, embudo: relFallback.embudo }] : [] });
  };
  const posponer = async (t: any, dias: number) => {
    const d = new Date(Math.max(Date.now(), new Date(t.vence).getTime())); d.setDate(d.getDate() + dias); d.setHours(10, 0, 0, 0);
    await supabase.from("crm_tareas").update({ vence: d.toISOString() }).eq("id", t.id); cargar();
  };
  const hecha = async (t: any) => { await supabase.from("crm_tareas").update({ hecha: true, hecha_at: new Date().toISOString() }).eq("id", t.id); cargar(); };

  const vencidas = tareas.filter((t) => new Date(t.vence) < inicioHoy());
  const hoy = tareas.filter((t) => new Date(t.vence) >= inicioHoy() && new Date(t.vence) <= finHoy());
  const proximas = tareas.filter((t) => new Date(t.vence) > finHoy());
  const sinContactar = rels.filter((r) => !r.primer_contacto_at && r.etapa === "nuevo").sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const recientes = sinContactar.filter((r) => Date.now() - +new Date(r.created_at) < 3 * 864e5);
  const enCurso = ["contactado", "descubrimiento", "calificado", "visita", "oferta_enviada", "negociacion", "reserva", "reunion", "interesado", "comprometido", "llamada_agendada", "asistio", "propuesta"];
  const estancados = rels.filter((r) => enCurso.includes(r.etapa) && (!r.ultima_gestion || Date.now() - +new Date(r.ultima_gestion) > 7 * 864e5)).sort((a, b) => b.temperatura - a.temperatura);
  const conTareaAbierta = new Set(tareas.map((t) => t.contact_id));
  const tanda = rels
    .filter((r) => r.telefono && ["nuevo", "contactado", "descubrimiento"].includes(r.etapa) && !conTareaAbierta.has(r.contact_id) && (!r.ultima_gestion || Date.now() - +new Date(r.ultima_gestion) > 7 * 864e5))
    .sort((a, b) => b.temperatura - a.temperatura || +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);
  const hoyIso = hoyBA();
  const manIso = diaBA(new Date(Date.now() + 864e5));
  const ofertasAtencion = ofertas.filter((o) => o.vence && o.vence <= manIso);

  const FilaTarea = ({ t, venc }: { t: any; venc?: boolean }) => (
    <div className={`item ${t.prioridad === "alta" ? "alta" : ""}`}>
      <div className="item-txt">
        <Link to={`/contactos/${t.contact_id}`} className="item-nombre">{t.crm_contacts?.nombre || "Sin contacto"}</Link>
        <span>{t.titulo}</span>
        <small className={venc ? "alerta" : "sub"}>{venc ? `Venció ${hace(t.vence)}` : new Date(t.vence).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}{equipo ? ` · ${t.responsable}` : ""}</small>
      </div>
      <div className="item-acc">
        {waLink(t.crm_contacts?.telefono) && <a href={waLink(t.crm_contacts?.telefono)!} target="_blank" rel="noreferrer"><button className="chico">WhatsApp</button></a>}
        <button className="chico primario" onClick={() => abrir(t.contact_id, t.crm_contacts?.nombre, t.crm_contacts?.telefono, t.id, t.tipo === "whatsapp" ? "whatsapp" : "llamada")}>Registrar</button>
        <button className="chico" onClick={() => posponer(t, 1)}>+1 día</button>
        <button className="chico" title="Marcar hecha sin registrar" onClick={() => hecha(t)}>✓</button>
      </div>
    </div>
  );

  const nombreDia = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="cabecera">
        <div>
          <h1>Buen día, {yo.nombre.split(" ")[0]}</h1>
          <p className="sub">{nombreDia[0].toUpperCase() + nombreDia.slice(1)} · {equipo ? "todo el equipo" : "solo lo que está a tu nombre"}</p>
        </div>
        {yo.admin && (
          <div className="segmentos">
            <button className={!equipo ? "activo" : ""} onClick={() => setEquipo(false)}>Lo mío</button>
            <button className={equipo ? "activo" : ""} onClick={() => setEquipo(true)}>Todo el equipo</button>
          </div>
        )}
      </div>
      <CarteraSinAtender alCambiar={cargar} />

      <div className="kpis">
        <div className={`kpi-mini ${vencidas.length ? "rojo" : ""}`}><b>{vencidas.length}</b><span>tareas vencidas</span></div>
        <div className="kpi-mini"><b>{hoy.length}</b><span>para hoy</span></div>
        <div className={`kpi-mini ${recientes.length ? "naranja" : ""}`}><b>{recientes.length}</b><span>leads nuevos sin contactar</span></div>
        <div className="kpi-mini"><b>{estancados.length}</b><span>estancados +7 días</span></div>
        <div className={`kpi-mini ${ofertasAtencion.length ? "naranja" : ""}`}><b>{ofertasAtencion.length}</b><span>ofertas por vencer</span></div>
      </div>

      <div className="columnas-dia">
        <div>
          {recientes.length > 0 && (
            <section className="panel urgente">
              <h2>Leads nuevos sin contactar <small>meta: primera respuesta en menos de 5 minutos</small></h2>
              {(verTodos ? recientes : recientes.slice(0, 5)).map((r) => (
                <div className="item" key={r.id}>
                  <div className="item-txt">
                    <Link to={`/contactos/${r.contact_id}`} className="item-nombre">{r.nombre}</Link>
                    <span>{UNIDADES[r.unidad]}{r.situacion ? ` · ${r.situacion}` : ""}{r.barrio ? ` · ${r.barrio}` : ""}</span>
                    <small className="alerta">Entró {hace(r.created_at)}</small>
                  </div>
                  <div className="item-acc">
                    {waLink(r.telefono) && <a href={waLink(r.telefono, `Hola ${r.nombre.split(" ")[0]}, te escribo de CIRE por la consulta que dejaste.`)!} target="_blank" rel="noreferrer"><button className="chico">WhatsApp</button></a>}
                    <button className="chico primario" onClick={() => abrir(r.contact_id, r.nombre, r.telefono, undefined, "llamada", r)}>Registrar</button>
                    <Descartar relationId={r.id} nombre={r.nombre.split(" ")[0]} alCambiar={cargar} />
                  </div>
                </div>
              ))}
              {recientes.length > 5 && <button className="chico" onClick={() => setVerTodos(!verTodos)}>{verTodos ? "Ver menos" : `Ver los otros ${recientes.length - 5}`}</button>}
            </section>
          )}

          <section className="panel">
            <h2>Tareas</h2>
            {vencidas.length > 0 && <><h3 className="alerta">Vencidas ({vencidas.length})</h3>{vencidas.slice(0, 25).map((t) => <Fragment key={t.id}>{FilaTarea({ t: t, venc: true })}</Fragment>)}{vencidas.length > 25 && <p className="sub chico">+{vencidas.length - 25} más</p>}</>}
            <h3>Hoy ({hoy.length})</h3>
            {hoy.length ? hoy.map((t) => <Fragment key={t.id}>{FilaTarea({ t: t })}</Fragment>) : <p className="sub">Nada agendado para hoy.</p>}
            {proximas.length > 0 && <><h3>Próximos 7 días ({proximas.length})</h3>{proximas.slice(0, 15).map((t) => <Fragment key={t.id}>{FilaTarea({ t: t })}</Fragment>)}</>}
          </section>
        </div>

        <div>
          <section className="panel destacado">
            <h2>Tanda de prospección del día <small>5 recontactos · bloque 9 a 11</small></h2>
            {tanda.map((r, i) => (
              <div className="item" key={r.id}>
                <span className="numero">{i + 1}</span>
                <div className="item-txt">
                  <Link to={`/contactos/${r.contact_id}`} className="item-nombre">{r.nombre}</Link>
                  <span>{r.situacion || UNIDADES[r.unidad]}{r.barrio ? ` · ${r.barrio}` : ""}</span>
                  <small className="sub">Última gestión: {hace(r.ultima_gestion)}</small>
                </div>
                <div className="item-acc">
                  <Temperatura t={r.temperatura} />
                  {waLink(r.telefono) && <a href={waLink(r.telefono)!} target="_blank" rel="noreferrer"><button className="chico">WhatsApp</button></a>}
                  <Descartar relationId={r.id} nombre={r.nombre.split(" ")[0]} alCambiar={cargar} />
                  <button className="chico primario" onClick={() => abrir(r.contact_id, r.nombre, r.telefono, undefined, "llamada", r)}>Registrar</button>
                </div>
              </div>
            ))}
            {!tanda.length && <p className="sub">No hay contactos para recontactar en tus unidades.</p>}
          </section>

          {ofertasAtencion.length > 0 && (
            <section className="panel">
              <h2>Ofertas que vencen <Link to="/ofertas" className="chico">ver todas</Link></h2>
              {ofertasAtencion.map((o) => (
                <div className="item" key={o.id}>
                  <div className="item-txt"><span className="item-nombre">{o.direccion}</span><span>{usd(o.monto_usd)}</span>
                    <small className={o.vence < hoyIso ? "alerta" : "sub"}>{o.vence < hoyIso ? "Venció" : "Vence"} {fecha(o.vence + "T12:00")}: ¿respondieron?</small></div>
                </div>
              ))}
            </section>
          )}

          <section className="panel">
            <h2>Estancados <small>más de 7 días sin gestión</small></h2>
            {estancados.slice(0, 10).map((r) => (
              <div className="item" key={r.id}>
                <div className="item-txt">
                  <Link to={`/contactos/${r.contact_id}`} className="item-nombre">{r.nombre}</Link>
                  <span>{r.etapa.replace(/_/g, " ")} · {UNIDADES[r.unidad]}</span>
                  <small className="sub">Última gestión: {hace(r.ultima_gestion)}</small>
                </div>
                <div className="item-acc"><Temperatura t={r.temperatura} /><button className="chico" onClick={() => abrir(r.contact_id, r.nombre, r.telefono, undefined, "llamada", r)}>Registrar</button></div>
              </div>
            ))}
            {!estancados.length && <p className="sub">Nada estancado.</p>}
          </section>
        </div>
      </div>

      {sinContactar.length > recientes.length && (
        <p className="sub chico">Además hay {sinContactar.length - recientes.length} leads viejos que nunca se contactaron: aparecen de a 5 en la tanda diaria.</p>
      )}

      {registro && <Registro ctx={registro} alCerrar={(c) => { setRegistro(null); if (c) cargar(); }} />}
    </>
  );
}
