import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config";
import { useYo } from "../main";

// Agenda con grilla horaria: Google Calendar (sincronizado por la dirección secreta iCal), reuniones del CRM,
// vencimientos de ofertas y obra. Las tareas van aparte, en la lista del día, para no tapar la grilla.
type Tipo = "google" | "reunion" | "oferta" | "obra";
type Ev = { key: string; tipo: Tipo; inicio: Date; fin: Date; todoElDia: boolean; titulo: string; detalle?: string; link?: string; externo?: string; hecho?: boolean; responsable?: string };
type Tarea = { id: string; vence: Date; titulo: string; contacto?: string; contact_id?: string; hecha: boolean; responsable: string };

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRE: Record<Tipo, string> = { google: "Google Calendar", reunion: "Reunión con lead", oferta: "Vence oferta", obra: "Obra" };
const ALTO_HORA = 48;
const lunesDe = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const diaClave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const hora = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const haceCuanto = (s: string) => { const m = Math.round((Date.now() - +new Date(s)) / 6e4); return m < 1 ? "recién" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`; };

// Reparte en columnas los eventos que se pisan, como Google Calendar
function acomodar(evs: Ev[]) {
  const orden = [...evs].sort((a, b) => +a.inicio - +b.inicio || +b.fin - +a.fin);
  const salida: { ev: Ev; col: number; cols: number }[] = [];
  let grupo: { ev: Ev; col: number }[] = [], finGrupo = 0;
  const cerrar = () => { const n = Math.max(1, ...grupo.map((g) => g.col + 1)); grupo.forEach((g) => salida.push({ ...g, cols: n })); grupo = []; };
  for (const ev of orden) {
    if (grupo.length && +ev.inicio >= finGrupo) cerrar();
    const ocupadas = grupo.filter((g) => +g.ev.fin > +ev.inicio).map((g) => g.col);
    let col = 0; while (ocupadas.includes(col)) col++;
    grupo.push({ ev, col }); finGrupo = Math.max(finGrupo, +ev.fin);
  }
  cerrar();
  return salida;
}

function Conexion({ alCambiar }: { alCambiar: () => void }) {
  const yo = useYo();
  const [cal, setCal] = useState<any | null | undefined>(undefined);
  const [url, setUrl] = useState("");
  const [editando, setEditando] = useState(false);
  const [estado, setEstado] = useState("");
  const leer = () => supabase.from("crm_calendarios").select("*").eq("usuario", yo.clave).maybeSingle().then(({ data }) => setCal(data));
  useEffect(() => { leer(); }, []);
  const sincronizar = async () => {
    setEstado("Sincronizando…");
    await supabase.rpc("crm_sincronizar_calendario");
    // La función corre en segundo plano: esperamos el resultado unos segundos
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await supabase.from("crm_calendarios").select("*").eq("usuario", yo.clave).maybeSingle();
      if (data && (data.ultimo_error || (data.ultimo_sync && Date.now() - +new Date(data.ultimo_sync) < 20000))) { setCal(data); break; }
    }
    setEstado(""); alCambiar();
  };
  const guardar = async () => {
    const limpia = url.trim();
    if (!/^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics$/.test(limpia)) { setEstado("Esa no es la dirección secreta. Tiene que empezar con https://calendar.google.com/calendar/ical/ y terminar en .ics"); return; }
    const { error } = await supabase.from("crm_calendarios").upsert({ usuario: yo.clave, ics_url: limpia, ultimo_error: null });
    if (error) { setEstado("No se pudo guardar: " + error.message); return; }
    setUrl(""); setEditando(false); await sincronizar();
  };

  if (cal === undefined) return null;
  if (cal && !editando) {
    return (
      <div className={`cal-estado ${cal.ultimo_error ? "error" : ""}`}>
        <span className="cal-punto" />
        <span>{cal.ultimo_error ? <>No se pudo sincronizar Google Calendar: {cal.ultimo_error}</> : cal.ultimo_sync ? <>Google Calendar sincronizado {haceCuanto(cal.ultimo_sync)} · {cal.eventos ?? 0} eventos en los próximos 60 días. Se actualiza solo cada 10 minutos.</> : "Google Calendar conectado. Primera sincronización en curso."}</span>
        <span className="cal-estado-acc">
          <button className="chico" onClick={sincronizar} disabled={!!estado}>{estado || "Sincronizar ahora"}</button>
          <button className="enlace chico" onClick={() => setEditando(true)}>Cambiar dirección</button>
        </span>
      </div>
    );
  }
  return (
    <div className="tarjeta cal-conectar">
      <h2>Conectá tu Google Calendar</h2>
      <p className="sub">Se hace una sola vez y después se sincroniza solo cada 10 minutos. Las reservas de tu agenda de ventas entran como reuniones con su ficha.</p>
      <ol>
        <li>Abrí <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer">la configuración de Google Calendar</a> desde la cuenta {yo.email}.</li>
        <li>A la izquierda, en "Configuración de mis calendarios", tocá tu calendario y bajá hasta "Integrar el calendario".</li>
        <li>Copiá la <strong>Dirección secreta en formato iCal</strong> y pegala acá.</li>
      </ol>
      <div className="fila cal-form">
        <input type="url" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" spellCheck={false} />
        <button className="primario" onClick={guardar}>Conectar</button>
        {cal && <button onClick={() => setEditando(false)}>Cancelar</button>}
      </div>
      {estado && <p className="sub chico">{estado}</p>}
      <p className="sub chico">Esa dirección da acceso de lectura a tu calendario: queda guardada sólo para tu usuario. Si alguna vez se filtra, en el mismo lugar de Google la podés regenerar.</p>
    </div>
  );
}

export default function Agenda() {
  const yo = useYo();
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [evs, setEvs] = useState<Ev[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [quien, setQuien] = useState<string>(yo.clave);
  const [tipos, setTipos] = useState<Record<Tipo, boolean>>({ google: true, reunion: true, oferta: true, obra: true });
  const [diaSel, setDiaSel] = useState(() => new Date());
  const [recarga, setRecarga] = useState(0);
  const [ahora, setAhora] = useState(new Date());
  const [angosto, setAngosto] = useState(() => window.innerWidth < 760);

  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 60000); const r = () => setAngosto(window.innerWidth < 760); window.addEventListener("resize", r); return () => { clearInterval(t); window.removeEventListener("resize", r); }; }, []);

  useEffect(() => {
    const desde = lunes.toISOString(), hasta = new Date(lunes.getTime() + 7 * 864e5).toISOString();
    (async () => {
      const [g, r, t, o, w] = await Promise.all([
        supabase.from("crm_calendario_eventos").select("uid,inicio,fin,todo_el_dia,titulo,ubicacion,link,invitados,usuario").gte("inicio", desde).lt("inicio", hasta).limit(2000),
        supabase.from("crm_reuniones").select("id,inicio,fin,titulo,estado,responsable,contact_id,link_reunion,google_event_id,crm_contacts(nombre)").gte("inicio", desde).lt("inicio", hasta).neq("estado", "cancelada"),
        supabase.from("crm_tareas").select("id,vence,titulo,hecha,responsable,contact_id,crm_contacts(nombre)").gte("vence", desde).lt("vence", hasta).order("vence").limit(1000),
        supabase.from("crm_ofertas").select("id,vence,direccion,monto_usd,estado,responsable,propiedad_id").gte("vence", desde.slice(0, 10)).lt("vence", hasta.slice(0, 10)),
        supabase.from("crm_obra_tareas").select("id,inicio,tarea,gremio,avance,propiedad_id,crm_propiedades(direccion,responsable)").gte("inicio", desde.slice(0, 10)).lt("inicio", hasta.slice(0, 10)),
      ]);
      const ligadas = new Set((r.data || []).map((x: any) => x.google_event_id).filter(Boolean));
      const media = (s: string) => new Date(s.length === 10 ? s + "T00:00" : s);
      setEvs([
        ...(g.data || []).filter((x: any) => !ligadas.has(`${x.uid}|${new Date(x.inicio).toISOString()}`)).map((x: any) => {
          const ext = (x.invitados || []).find((i: any) => i.email !== yo.email.toLowerCase());
          return { key: "g" + x.uid + x.inicio, tipo: "google" as const, inicio: new Date(x.inicio), fin: new Date(x.fin || x.inicio), todoElDia: x.todo_el_dia, titulo: x.titulo || "(sin título)", detalle: x.ubicacion || undefined, externo: x.link || undefined, responsable: x.usuario, ...(ext ? { detalle: ext.nombre || ext.email } : {}) };
        }),
        ...(r.data || []).map((x: any) => { const ini = new Date(x.inicio); return { key: "r" + x.id, tipo: "reunion" as const, inicio: ini, fin: x.fin ? new Date(x.fin) : new Date(+ini + 30 * 6e4), todoElDia: false, titulo: x.crm_contacts?.nombre || x.titulo || "Reunión", detalle: x.titulo || undefined, link: x.contact_id ? `/contactos/${x.contact_id}` : undefined, externo: x.link_reunion || undefined, hecho: x.estado === "realizada", responsable: x.responsable }; }),
        ...(o.data || []).filter((x: any) => !["aceptada", "rechazada", "cerrada", "vencida"].includes(x.estado)).map((x: any) => ({ key: "o" + x.id, tipo: "oferta" as const, inicio: media(x.vence), fin: media(x.vence), todoElDia: true, titulo: x.direccion, detalle: `USD ${Number(x.monto_usd).toLocaleString("es-AR")}`, link: x.propiedad_id ? `/propiedades/${x.propiedad_id}` : "/ofertas", responsable: x.responsable })),
        ...(w.data || []).map((x: any) => ({ key: "w" + x.id, tipo: "obra" as const, inicio: media(x.inicio), fin: media(x.inicio), todoElDia: true, titulo: x.tarea, detalle: `${x.gremio} · ${x.crm_propiedades?.direccion || ""}`, link: `/propiedades/${x.propiedad_id}`, hecho: x.avance >= 100, responsable: x.crm_propiedades?.responsable })),
      ]);
      setTareas((t.data || []).map((x: any) => ({ id: x.id, vence: new Date(x.vence), titulo: x.titulo, contacto: x.crm_contacts?.nombre, contact_id: x.contact_id, hecha: x.hecha, responsable: x.responsable })));
    })();
  }, [lunes, recarga]);

  const deQuien = (resp?: string) => quien === "todos" || resp === quien;
  const vis = useMemo(() => evs.filter((e) => tipos[e.tipo] && deQuien(e.responsable)), [evs, tipos, quien]);
  const tareasVis = useMemo(() => tareas.filter((t) => deQuien(t.responsable)), [tareas, quien]);
  const dias = Array.from({ length: 7 }, (_, i) => new Date(lunes.getTime() + i * 864e5));
  const columnas = angosto ? dias.filter((d) => diaClave(d) === diaClave(diaSel)) : dias;
  const enGrilla = vis.filter((e) => !e.todoElDia);
  const horas = enGrilla.map((e) => e.inicio.getHours() + e.inicio.getMinutes() / 60);
  const finHoras = enGrilla.map((e) => e.fin.getHours() + e.fin.getMinutes() / 60 || 24);
  const hDesde = Math.min(8, ...horas.map(Math.floor)), hHasta = Math.max(20, ...finHoras.map(Math.ceil));
  const rango = `${dias[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} al ${dias[6].toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
  const tareasDia = tareasVis.filter((t) => diaClave(t.vence) === diaClave(diaSel));
  const cambiarSemana = (n: number) => { const l = new Date(lunes.getTime() + n * 7 * 864e5); setLunes(l); setDiaSel(n === 0 ? new Date() : l); };
  const moverDia = (n: number) => { const d = new Date(diaSel.getTime() + n * 864e5); setDiaSel(d); if (diaClave(lunesDe(d)) !== diaClave(lunes)) setLunes(lunesDe(d)); };

  const tarjeta = (e: Ev, estilo?: React.CSSProperties) => {
    const cuerpo = (<><small>{e.todoElDia ? NOMBRE[e.tipo] : `${hora(e.inicio)}–${hora(e.fin)}`}</small><span>{e.titulo}</span>{e.detalle && <small className="sub">{e.detalle}</small>}</>);
    const cls = `ev ev-${e.tipo} ${e.hecho ? "hecho" : ""}`;
    const titulo = `${e.titulo}${e.detalle ? " · " + e.detalle : ""}`;
    if (e.link) return <Link key={e.key} to={e.link} className={cls} style={estilo} title={titulo}>{cuerpo}</Link>;
    if (e.externo) return <a key={e.key} href={e.externo} target="_blank" rel="noreferrer" className={cls} style={estilo} title={titulo}>{cuerpo}</a>;
    return <div key={e.key} className={cls} style={estilo} title={titulo}>{cuerpo}</div>;
  };

  const minutoAhora = (ahora.getHours() - hDesde) * ALTO_HORA + (ahora.getMinutes() / 60) * ALTO_HORA;

  return (
    <>
      <div className="cabecera">
        <div><h1>Agenda</h1><p className="sub">Tu Google Calendar, las reuniones con leads, los vencimientos de ofertas y la obra en una sola semana.</p></div>
        <a className="boton" href="https://calendar.google.com" target="_blank" rel="noreferrer">Abrir Google Calendar</a>
      </div>

      <Conexion alCambiar={() => setRecarga((n) => n + 1)} />

      <div className="agenda-barra">
        <div className="fila">
          <button className="chico" onClick={() => (angosto ? moverDia(-1) : cambiarSemana(-1))} aria-label={angosto ? "Día anterior" : "Semana anterior"}>←</button>
          <button className="chico" onClick={() => { setLunes(lunesDe(new Date())); setDiaSel(new Date()); }}>Hoy</button>
          <button className="chico" onClick={() => (angosto ? moverDia(1) : cambiarSemana(1))} aria-label={angosto ? "Día siguiente" : "Semana siguiente"}>→</button>
          <strong className="agenda-rango">{angosto ? diaSel.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase()) : rango}</strong>
        </div>
        <div className="segmentos">
          <button className={quien !== "todos" ? "activo" : ""} onClick={() => setQuien(yo.clave)}>Lo mío</button>
          <button className={quien === "todos" ? "activo" : ""} onClick={() => setQuien("todos")}>Todo el equipo</button>
        </div>
        <div className="agenda-leyenda">
          {(Object.keys(NOMBRE) as Tipo[]).map((t) => (
            <button key={t} className={`leyenda ev-${t} ${tipos[t] ? "" : "apagado"}`} aria-pressed={tipos[t]} onClick={() => setTipos({ ...tipos, [t]: !tipos[t] })}><i />{NOMBRE[t]}</button>
          ))}
        </div>
      </div>

      <div className="agenda-cal tarjeta">
        <div className="agenda-cab" style={{ gridTemplateColumns: `56px repeat(${columnas.length}, minmax(0, 1fr))` }}>
          <div />
          {columnas.map((d) => {
            const cuantas = tareasVis.filter((t) => diaClave(t.vence) === diaClave(d) && !t.hecha).length;
            const esHoy = diaClave(d) === diaClave(ahora);
            return (
              <button key={d.toISOString()} className={`agenda-dia ${esHoy ? "hoy" : ""} ${diaClave(d) === diaClave(diaSel) ? "sel" : ""}`} onClick={() => setDiaSel(d)}>
                <span>{DIAS[(d.getDay() + 6) % 7]}</span><b>{d.getDate()}</b>
                {cuantas > 0 && <small className="agenda-tareas">{cuantas} {cuantas === 1 ? "tarea" : "tareas"}</small>}
              </button>
            );
          })}
        </div>
        {vis.some((e) => e.todoElDia) && (
          <div className="agenda-todo-dia" style={{ gridTemplateColumns: `56px repeat(${columnas.length}, minmax(0, 1fr))` }}>
            <small className="sub">Todo el día</small>
            {columnas.map((d) => <div key={d.toISOString()}>{vis.filter((e) => e.todoElDia && diaClave(e.inicio) === diaClave(d)).map((e) => tarjeta(e))}</div>)}
          </div>
        )}
        <div className="agenda-grilla" style={{ gridTemplateColumns: `56px repeat(${columnas.length}, minmax(0, 1fr))`, height: (hHasta - hDesde) * ALTO_HORA }}>
          <div className="agenda-horas">{Array.from({ length: hHasta - hDesde }, (_, i) => <span key={i} style={{ top: i * ALTO_HORA }}>{String(hDesde + i).padStart(2, "0")}:00</span>)}</div>
          {columnas.map((d) => {
            const del = enGrilla.filter((e) => diaClave(e.inicio) === diaClave(d));
            const esHoy = diaClave(d) === diaClave(ahora);
            return (
              <div key={d.toISOString()} className={`agenda-col ${(d.getDay() + 6) % 7 > 4 ? "finde" : ""}`} style={{ backgroundSize: `100% ${ALTO_HORA}px` }}>
                {acomodar(del).map(({ ev, col, cols }) => {
                  const top = ((ev.inicio.getHours() - hDesde) + ev.inicio.getMinutes() / 60) * ALTO_HORA;
                  const alto = Math.max(22, ((+ev.fin - +ev.inicio) / 36e5) * ALTO_HORA - 2);
                  return tarjeta(ev, { position: "absolute", top, height: alto, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` });
                })}
                {esHoy && minutoAhora > 0 && minutoAhora < (hHasta - hDesde) * ALTO_HORA && <div className="agenda-ahora" style={{ top: minutoAhora }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="tarjeta agenda-lista">
        <h2>Tareas del {diaSel.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} <small className="sub">{tareasDia.filter((t) => !t.hecha).length} pendientes</small></h2>
        {tareasDia.map((t) => (
          <div key={t.id} className={`agenda-tarea ${t.hecha ? "hecha" : ""}`}>
            <span className="sub">{hora(t.vence)}</span>
            <span>{t.titulo}</span>
            {t.contact_id ? <Link to={`/contactos/${t.contact_id}`}>{t.contacto || "Ver ficha"}</Link> : <span />}
          </div>
        ))}
        {!tareasDia.length && <p className="sub">No hay tareas para este día. Tocá otro día arriba para ver las suyas.</p>}
      </div>
    </>
  );
}
