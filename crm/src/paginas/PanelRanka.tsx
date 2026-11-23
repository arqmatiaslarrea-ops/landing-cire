import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EMBUDOS, supabase, waLink, traerTodo } from "../config";
import { puedeOperar, useMarca, useYo } from "../main";
import Registro, { type ContextoRegistro } from "../componentes/Registro";
import Descartar from "../componentes/Descartar";

// Panel de Ranka (Agency + Ranka by CIRE), con el sistema de marca de Ranka.
// Es el inicio de Sofi: lo que hay que mover hoy, los dos embudos, la cartera y el reporte mensual de cada cliente.
const UNIDADES_RANKA = ["ranka", "ranka_by_cire"];
const ORIGEN_CEREBRO = "Cartera cargada desde el Cerebro (a confirmar)";
const mesClave = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const mesNombre = (d = new Date()) => d.toLocaleDateString("es-AR", { month: "long" });
const nombre1 = (n: string) => (n || "").split(" ")[0].replace(/^./, (c) => c.toUpperCase());
const hace = (s?: string | null) => { if (!s) return "nunca"; const h = Math.round((Date.now() - +new Date(s)) / 36e5); return h < 1 ? "recién" : h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`; };

export function Estrella({ tam = 18 }: { tam?: number }) {
  return <svg className="rk-estrella" width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0z" /></svg>;
}

export default function PanelRanka() {
  useMarca("ranka");
  const yo = useYo();
  const [rels, setRels] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [reportes, setReportes] = useState<Record<string, string>>({});
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [registro, setRegistro] = useState<ContextoRegistro | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const ahora = new Date();
    const [r, t, m, a, o] = await Promise.all([
      traerTodo(() => supabase.from("crm_vista_relaciones").select("id,contact_id,nombre,telefono,email,empresa,unidad,embudo,etapa,estado,responsable,origen,created_at,primer_contacto_at,ultima_gestion,proximo_paso").order("id").in("unidad", UNIDADES_RANKA)),
      supabase.from("crm_tareas").select("id,titulo,vence,contact_id,unidad,responsable,crm_contacts(nombre)").eq("hecha", false).in("unidad", UNIDADES_RANKA).lte("vence", new Date(ahora.getTime() + 864e5).toISOString()).order("vence").limit(50),
      supabase.from("crm_reuniones").select("id,inicio,titulo,estado,contact_id,link_reunion,crm_contacts(nombre)").in("unidad", UNIDADES_RANKA).gte("inicio", new Date(ahora.getTime() - 36e5).toISOString()).lte("inicio", new Date(ahora.getTime() + 7 * 864e5).toISOString()).neq("estado", "cancelada").order("inicio"),
      supabase.from("crm_activities").select("contact_id,created_at,detalle").eq("tipo", "reporte_mensual").gte("created_at", new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()),
      supabase.rpc("crm_objetivos_avance"),
    ]);
    setRels(r.data || []); setTareas(t.data || []); setReuniones(m.data || []);
    setReportes(Object.fromEntries((a.data || []).filter((x: any) => x.detalle?.mes === mesClave()).map((x: any) => [x.contact_id, x.created_at])));
    setObjetivos((o.data || []).filter((x: any) => UNIDADES_RANKA.includes(x.unidad)));
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const activos = rels.filter((r) => r.estado !== "descartado");
  const clientes = activos.filter((r) => r.etapa === "cliente");
  const leadsNuevos = activos.filter((r) => r.etapa === "nuevo" && !r.primer_contacto_at).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const propuestas = activos.filter((r) => r.etapa === "propuesta");
  const sinReporte = clientes.filter((c) => !reportes[c.contact_id]);
  const opera = puedeOperar(yo, "ranka");
  const embudos = EMBUDOS.filter((e) => UNIDADES_RANKA.includes(e.unidad));
  const cuenta = useMemo(() => {
    const m: Record<string, number> = {};
    activos.forEach((r) => { m[`${r.embudo}:${r.etapa}`] = (m[`${r.embudo}:${r.etapa}`] || 0) + 1; });
    return m;
  }, [rels]);

  const marcarReporte = async (c: any) => {
    setReportes((x) => ({ ...x, [c.contact_id]: new Date().toISOString() }));
    await supabase.from("crm_activities").insert({ contact_id: c.contact_id, unidad: "ranka", tipo: "reporte_mensual", detalle: { mes: mesClave(), resultado: `Reporte mensual de ${mesNombre()} enviado` } });
  };
  const msg = (r: any) => r.unidad === "ranka_by_cire"
    ? `Hola ${nombre1(r.nombre)}, ¿cómo estás? Soy ${nombre1(yo.nombre)}, de Ranka. Vi que te interesó el Club +MIL para tus publicaciones. ¿Te parece si coordinamos una llamada corta y te muestro cómo trabajamos los avisos?`
    : `Hola ${nombre1(r.nombre)}, ¿cómo estás? Soy ${nombre1(yo.nombre)}, de Ranka Agency. Gracias por escribirnos. ¿Coordinamos una llamada corta para entender qué necesitás?`;

  return (
    <div className="rk">
      <section className="rk-hero">
        <div className="rk-hero-txt">
          <div className="rk-marca"><span>RANKA</span><Estrella tam={20} /></div>
          <h1>Hola, {nombre1(yo.nombre)}</h1>
          <p>Lo que hay que mover hoy en Ranka Agency y Ranka by CIRE.</p>
          <Link to="/ranka/finanzas" className="boton rk-boton-fz">Finanzas de Ranka</Link>
        </div>
        <div className="rk-kpis">
          <div><b>{clientes.length}</b><span>clientes activos</span></div>
          <div className={leadsNuevos.length ? "alerta" : ""}><b>{leadsNuevos.length}</b><span>leads sin contactar</span></div>
          <div><b>{reuniones.length}</b><span>llamadas en 7 días</span></div>
          <div><b>{propuestas.length}</b><span>propuestas abiertas</span></div>
          <div className={sinReporte.length ? "alerta" : ""}><b>{sinReporte.length}</b><span>reportes de {mesNombre()} pendientes</span></div>
        </div>
      </section>

      <div className="rk-columnas">
        <section className="rk-tarjeta">
          <h2>Para hoy</h2>
          {leadsNuevos.slice(0, 8).map((r) => {
            const wa = waLink(r.telefono, msg(r));
            return (
              <div key={r.id} className="item">
                <div className="item-txt">
                  <Link to={`/contactos/${r.contact_id}`} className="item-nombre">{r.nombre}</Link>
                  <small className="sub">{r.unidad === "ranka_by_cire" ? "Club +MIL" : "Ranka Agency"} · entró {hace(r.created_at)}</small>
                </div>
                {opera && <div className="item-acc">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="boton chico">WhatsApp</a>}
                  <button className="chico primario" onClick={() => setRegistro({ contactId: r.contact_id, nombre: r.nombre, telefono: r.telefono, relaciones: [{ id: r.id, unidad: r.unidad, embudo: r.embudo }] })}>Registrar</button>
                  <Descartar relationId={r.id} nombre={nombre1(r.nombre)} alCambiar={cargar} />
                </div>}
              </div>
            );
          })}
          {tareas.map((t) => (
            <div key={t.id} className="item">
              <div className="item-txt">
                <span className="item-nombre">{t.titulo}</span>
                <small className={new Date(t.vence) < new Date() ? "alerta" : "sub"}>{new Date(t.vence) < new Date() ? "Vencida · " : ""}{new Date(t.vence).toLocaleString("es-AR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}{t.crm_contacts?.nombre ? ` · ${t.crm_contacts.nombre}` : ""}</small>
              </div>
              {t.contact_id && <Link to={`/contactos/${t.contact_id}`} className="boton chico">Abrir</Link>}
            </div>
          ))}
          {!cargando && !leadsNuevos.length && !tareas.length && (
            <div className="rk-vacio"><Estrella tam={22} /><p>Nada pendiente para hoy. Los leads de la web de Ranka y del Club +MIL aparecen acá apenas entran.</p></div>
          )}
        </section>

        <section className="rk-tarjeta">
          <h2>Próximas llamadas</h2>
          {reuniones.map((m) => (
            <div key={m.id} className="item">
              <div className="item-txt">
                <span className="item-nombre">{m.crm_contacts?.nombre || m.titulo || "Reunión"}</span>
                <small className="sub">{new Date(m.inicio).toLocaleString("es-AR", { weekday: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}{m.estado === "confirmada" ? " · confirmada" : ""}</small>
              </div>
              <div className="item-acc">
                {m.link_reunion && <a href={m.link_reunion} target="_blank" rel="noreferrer" className="boton chico">Entrar</a>}
                {m.contact_id && <Link to={`/contactos/${m.contact_id}`} className="boton chico">Ficha</Link>}
              </div>
            </div>
          ))}
          {!cargando && !reuniones.length && <p className="sub">Sin llamadas agendadas esta semana. Las reservas de la agenda de ventas entran solas.</p>}
          <Link to="/agenda" className="rk-link">Ver la agenda completa</Link>
        </section>
      </div>

      <section className="rk-embudos">
        {embudos.map((e) => {
          const etapas = e.etapas.filter((x) => !x.cierre || x.id === "cliente");
          const max = Math.max(1, ...etapas.map((x) => cuenta[`${e.id}:${x.id}`] || 0));
          return (
            <div key={e.id} className="rk-tarjeta">
              <div className="rk-tarjeta-cab"><h2>{e.unidad === "ranka" ? "Ranka Agency" : "Ranka by CIRE · Club +MIL"}</h2><Link to={`/embudos?embudo=${e.id}`} className="rk-link">Abrir embudo</Link></div>
              {etapas.map((x) => {
                const n = cuenta[`${e.id}:${x.id}`] || 0;
                return (
                  <div key={x.id} className="rk-barra">
                    <span>{x.nombre}</span>
                    <div><i style={{ width: `${(n / max) * 100}%` }} /></div>
                    <b>{n}</b>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="rk-tarjeta">
        <div className="rk-tarjeta-cab"><h2>Cartera y reporte de {mesNombre()}</h2><small className="sub">El reporte a clientes es mensual.</small></div>
        <div className="tabla-scroll">
          <table className="rk-tabla">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Responsable</th><th>Reporte de {mesNombre()}</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/contactos/${c.contact_id}`} className="celda-nombre">{c.empresa || c.nombre}</Link>{c.origen === ORIGEN_CEREBRO && <small className="rk-confirmar">A confirmar</small>}</td>
                  <td>{c.empresa && c.empresa !== c.nombre ? c.nombre : <span className="sub">Sin cargar</span>}</td>
                  <td>{c.responsable === "sofi" ? "Sofi" : c.responsable === "mati" ? "Mati" : c.responsable || "—"}</td>
                  <td>{reportes[c.contact_id]
                    ? <span className="rk-ok">Enviado el {new Date(reportes[c.contact_id]).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" })}</span>
                    : opera ? <button className="chico" onClick={() => marcarReporte(c)}>Marcar enviado</button> : <span className="sub">Pendiente</span>}</td>
                </tr>
              ))}
              {!cargando && !clientes.length && <tr><td colSpan={4} className="sub">Todavía no hay clientes cargados.</td></tr>}
            </tbody>
          </table>
        </div>
        {clientes.some((c) => c.origen === ORIGEN_CEREBRO) && <p className="sub chico">Los clientes marcados "A confirmar" se cargaron desde el Cerebro: revisá con Mati que la cartera esté completa y sumá el contacto de cada uno.</p>}
      </section>

      {objetivos.length > 0 && (
        <section className="rk-tarjeta">
          <h2>Objetivos</h2>
          <div className="rk-objetivos">
            {objetivos.map((o) => (
              <div key={o.clave}>
                <span>{o.titulo}</span>
                <div className="rk-obj-barra"><i style={{ width: `${Math.min(100, (Number(o.actual) / Number(o.meta)) * 100)}%` }} /></div>
                <small className="sub"><b>{Number(o.actual)}</b> de {Number(o.meta)} · al {new Date(o.horizonte + "T12:00").toLocaleDateString("es-AR")}{!o.validado && " · meta propuesta, a validar"}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {registro && <Registro ctx={registro} alCerrar={(c) => { setRegistro(null); if (c) cargar(); }} />}
    </div>
  );
}
