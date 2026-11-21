import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config";
import { useYo } from "../main";

// Agenda unificada: reuniones (incluye las que entran desde Google Calendar), tareas con vencimiento,
// vencimientos de ofertas y tareas de obra, en una semana. Más la vista de Google Calendar embebida.
type Ev = { id: string; tipo: "reunion" | "tarea" | "oferta" | "obra"; inicio: Date; titulo: string; detalle?: string; link?: string; hecho?: boolean; responsable?: string };
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const lunesDe = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const COLOR: Record<Ev["tipo"], string> = { reunion: "ev-reunion", tarea: "ev-tarea", oferta: "ev-oferta", obra: "ev-obra" };
const NOMBRE: Record<Ev["tipo"], string> = { reunion: "Reunión", tarea: "Tarea", oferta: "Vence oferta", obra: "Obra" };

export default function Agenda() {
  const yo = useYo();
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [evs, setEvs] = useState<Ev[]>([]);
  const [quien, setQuien] = useState<string>(yo.clave);
  const [vista, setVista] = useState<"crm" | "google">("crm");
  const [tipos, setTipos] = useState<Record<Ev["tipo"], boolean>>({ reunion: true, tarea: true, oferta: true, obra: true });

  useEffect(() => {
    const desde = lunes.toISOString(), hasta = new Date(lunes.getTime() + 7 * 864e5).toISOString();
    (async () => {
      const [r, t, o, w] = await Promise.all([
        supabase.from("crm_reuniones").select("id,inicio,titulo,estado,responsable,contact_id,link_reunion,crm_contacts(nombre)").gte("inicio", desde).lt("inicio", hasta).neq("estado", "cancelada"),
        supabase.from("crm_tareas").select("id,vence,titulo,hecha,responsable,contact_id,crm_contacts(nombre)").gte("vence", desde).lt("vence", hasta).limit(1000),
        supabase.from("crm_ofertas").select("id,vence,direccion,monto_usd,estado,responsable,propiedad_id").gte("vence", desde.slice(0, 10)).lt("vence", hasta.slice(0, 10)),
        supabase.from("crm_obra_tareas").select("id,inicio,tarea,gremio,avance,propiedad_id,crm_propiedades(direccion,responsable)").gte("inicio", desde.slice(0, 10)).lt("inicio", hasta.slice(0, 10)),
      ]);
      setEvs([
        ...(r.data || []).map((x: any) => ({ id: x.id, tipo: "reunion" as const, inicio: new Date(x.inicio), titulo: x.crm_contacts?.nombre || x.titulo || "Reunión", detalle: x.titulo || x.estado, link: x.contact_id ? `/contactos/${x.contact_id}` : undefined, hecho: x.estado === "realizada", responsable: x.responsable })),
        ...(t.data || []).map((x: any) => ({ id: x.id, tipo: "tarea" as const, inicio: new Date(x.vence), titulo: x.titulo, detalle: x.crm_contacts?.nombre, link: x.contact_id ? `/contactos/${x.contact_id}` : undefined, hecho: x.hecha, responsable: x.responsable })),
        ...(o.data || []).filter((x: any) => !["aceptada", "rechazada", "cerrada", "vencida"].includes(x.estado)).map((x: any) => ({ id: x.id, tipo: "oferta" as const, inicio: new Date(x.vence + "T18:00"), titulo: x.direccion, detalle: `USD ${Number(x.monto_usd).toLocaleString("es-AR")}`, link: x.propiedad_id ? `/propiedades/${x.propiedad_id}` : "/ofertas", responsable: x.responsable })),
        ...(w.data || []).map((x: any) => ({ id: x.id, tipo: "obra" as const, inicio: new Date(x.inicio + "T08:00"), titulo: x.tarea, detalle: `${x.gremio} · ${x.crm_propiedades?.direccion || ""}`, link: `/propiedades/${x.propiedad_id}`, hecho: x.avance >= 100, responsable: x.crm_propiedades?.responsable })),
      ]);
    })();
  }, [lunes]);

  const vis = useMemo(() => evs.filter((e) => tipos[e.tipo] && (quien === "todos" || e.responsable === quien)).sort((a, b) => +a.inicio - +b.inicio), [evs, tipos, quien]);
  const dias = Array.from({ length: 7 }, (_, i) => new Date(lunes.getTime() + i * 864e5));
  const hoy = iso(new Date());
  const rango = `${dias[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} al ${dias[6].toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
  const gcal = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(yo.email)}&ctz=America%2FArgentina%2FBuenos_Aires&mode=WEEK&showPrint=0&showTitle=0`;

  return (
    <>
      <div className="cabecera">
        <div><h1>Agenda</h1><p className="sub">Reuniones, tareas, vencimientos de ofertas y obra en una sola semana. Las reservas de tu Google Calendar entran como reuniones.</p></div>
        <div className="segmentos">
          <button className={vista === "crm" ? "activo" : ""} onClick={() => setVista("crm")}>Agenda del CRM</button>
          <button className={vista === "google" ? "activo" : ""} onClick={() => setVista("google")}>Mi Google Calendar</button>
        </div>
      </div>

      {vista === "google" ? (
        <div className="tarjeta" style={{ padding: 0, overflow: "hidden" }}>
          <iframe title="Google Calendar" src={gcal} style={{ border: 0, width: "100%", height: "75vh" }} />
          <p className="sub chico" style={{ padding: "8px 14px" }}>Se ve si en este navegador tenés abierta la sesión de Google de {yo.email}. Si aparece vacío, abrí <a href="https://calendar.google.com" target="_blank" rel="noreferrer">Google Calendar</a> una vez y volvé.</p>
        </div>
      ) : (
        <>
          <div className="filtros">
            <div className="fila">
              <button className="chico" onClick={() => setLunes(new Date(lunes.getTime() - 7 * 864e5))} aria-label="Semana anterior">←</button>
              <button className="chico" onClick={() => setLunes(lunesDe(new Date()))}>Hoy</button>
              <button className="chico" onClick={() => setLunes(new Date(lunes.getTime() + 7 * 864e5))} aria-label="Semana siguiente">→</button>
              <strong>{rango}</strong>
            </div>
            <select value={quien} onChange={(e) => setQuien(e.target.value)} aria-label="De quién">
              <option value={yo.clave}>Solo lo mío</option>
              <option value="todos">Todo el equipo</option>
            </select>
            <div className="fila">
              {(Object.keys(NOMBRE) as Ev["tipo"][]).map((t) => (
                <label key={t} className="fila chico"><input type="checkbox" checked={tipos[t]} onChange={(e) => setTipos({ ...tipos, [t]: e.target.checked })} /><span className={`ev-punto ${COLOR[t]}`} />{NOMBRE[t]}</label>
              ))}
            </div>
          </div>
          <div className="semana">
            {dias.map((d, i) => {
              const del = vis.filter((e) => iso(e.inicio) === iso(d));
              return (
                <div key={i} className={`dia ${iso(d) === hoy ? "hoy" : ""} ${i > 4 ? "finde" : ""}`}>
                  <div className="dia-cab"><span>{DIAS[i]}</span><b>{d.getDate()}</b></div>
                  {del.map((e) => {
                    const hora = e.tipo === "reunion" || e.tipo === "tarea" ? e.inicio.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";
                    const cuerpo = (<><small>{hora && `${hora} · `}{NOMBRE[e.tipo]}</small><span>{e.titulo}</span>{e.detalle && <small className="sub">{e.detalle}</small>}</>);
                    return e.link
                      ? <Link key={e.tipo + e.id} to={e.link} className={`ev ${COLOR[e.tipo]} ${e.hecho ? "hecho" : ""}`}>{cuerpo}</Link>
                      : <div key={e.tipo + e.id} className={`ev ${COLOR[e.tipo]} ${e.hecho ? "hecho" : ""}`}>{cuerpo}</div>;
                  })}
                  {!del.length && <small className="sub vacio">—</small>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
